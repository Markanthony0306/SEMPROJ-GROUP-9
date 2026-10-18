import { Children, cloneElement, isValidElement, useId, useMemo, useState } from 'react'

function textContent(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textContent).join(' ')
  if (isValidElement(node))
    return textContent(node.props.children ?? node.props.status ?? node.props.value)
  return ''
}

export default function DataTable({ headings, children, empty, caption = 'Records' }) {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ index: null, ascending: true })
  const pageSize = 10
  const rows = useMemo(() => {
    const result = empty
      ? []
      : Children.toArray(children).filter((row) =>
          textContent(row).toLowerCase().includes(query.trim().toLowerCase())
        )
    if (sort.index !== null)
      result.sort((a, b) => {
        const aText = textContent(Children.toArray(a.props.children)[sort.index])
        const bText = textContent(Children.toArray(b.props.children)[sort.index])
        let comparison
        if (/amount/i.test(headings[sort.index]))
          comparison = Number(aText.replace(/[^\d.-]/g, '')) - Number(bText.replace(/[^\d.-]/g, ''))
        else if (
          /date|joined|expires/i.test(headings[sort.index]) &&
          Number.isFinite(Date.parse(aText)) &&
          Number.isFinite(Date.parse(bText))
        )
          comparison = Date.parse(aText) - Date.parse(bText)
        else
          comparison = aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' })
        return sort.ascending ? comparison : -comparison
      })
    return result
  }, [children, empty, headings, query, sort])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const visibleRows = rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  return (
    <div className="data-table">
      <div className="table-toolbar">
        <label htmlFor={searchId}>
          Search records
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder="Type to filter..."
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
          />
        </label>
        <label className="table-sort">
          Sort records
          <select
            value={sort.index === null ? 'original' : `${sort.index}:${sort.ascending}`}
            onChange={(event) => {
              const [index, ascending] = event.target.value.split(':')
              setSort({
                index: index === 'original' ? null : Number(index),
                ascending: ascending !== 'false'
              })
              setPage(0)
            }}
          >
            <option value="original">Original order</option>
            {headings.flatMap((heading, index) =>
              /^actions?$/i.test(heading)
                ? []
                : [
                    <option key={`${index}-asc`} value={`${index}:true`}>
                      {heading}: ascending
                    </option>,
                    <option key={`${index}-desc`} value={`${index}:false`}>
                      {heading}: descending
                    </option>
                  ]
            )}
          </select>
        </label>
        <span>
          {rows.length} record{rows.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="table-wrap">
        <table role="table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr role="row">
              {headings.map((heading, index) => (
                <th
                  role="columnheader"
                  scope="col"
                  key={heading}
                  aria-sort={
                    sort.index === index ? (sort.ascending ? 'ascending' : 'descending') : undefined
                  }
                >
                  {/^actions?$/i.test(heading) ? (
                    heading
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSort({ index, ascending: sort.index === index ? !sort.ascending : true })
                        setPage(0)
                      }}
                    >
                      {heading}
                      <span aria-hidden="true">
                        {sort.index === index ? (sort.ascending ? ' ↑' : ' ↓') : ' ↕'}
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length ? (
              visibleRows.map((row) =>
                cloneElement(
                  row,
                  { role: 'row' },
                  Children.toArray(row.props.children).map((cell, index) =>
                    isValidElement(cell)
                      ? cloneElement(
                          cell,
                          { role: 'cell', 'data-label': headings[index] },
                          cell.props.className?.split(' ').includes('acts') ? (
                            <div className="table-cell-actions">{cell.props.children}</div>
                          ) : (
                            cell.props.children
                          )
                        )
                      : cell
                  )
                )
              )
            ) : (
              <tr role="row">
                <td role="cell" colSpan={headings.length} className="table-empty">
                  {query ? 'No matching records. Try another search.' : 'No records yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <span aria-live="polite">
          Page {currentPage + 1} of {pageCount}
        </span>
        <div>
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage + 1 >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
