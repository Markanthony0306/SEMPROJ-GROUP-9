import { Children, cloneElement, isValidElement, useId, useMemo, useState } from 'react'

function textContent(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textContent).join(' ')
  if (isValidElement(node))
    return textContent(node.props.children ?? node.props.status ?? node.props.value)
  return ''
}

export default function DataTable({
  headings,
  children,
  empty,
  caption = 'Records',
  searchable = true
}) {
  const searchId = useId()
  const sortFieldId = useId()
  const sortOrderId = useId()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ index: null, ascending: true })
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
  return (
    <div className="data-table">
      <div className="table-toolbar">
        {searchable && (
          <label htmlFor={searchId}>
            Search records
            <input
              id={searchId}
              type="search"
              value={query}
              placeholder="Type to filter..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        )}
        <label className="table-sort table-sort-field" htmlFor={sortFieldId}>
          Records
          <select
            id={sortFieldId}
            value={sort.index === null ? 'original' : sort.index}
            onChange={(event) => {
              setSort({
                index: event.target.value === 'original' ? null : Number(event.target.value),
                ascending: sort.ascending
              })
            }}
          >
            <option value="original">Original order</option>
            {headings.map((heading, index) =>
              /^actions?$/i.test(heading) ? null : (
                <option key={index} value={index}>
                  {heading}
                </option>
              )
            )}
          </select>
        </label>
        <label className="table-sort table-sort-order" htmlFor={sortOrderId}>
          Sort by:
          <select
            id={sortOrderId}
            value={sort.ascending ? 'ascending' : 'descending'}
            onChange={(event) => {
              setSort((current) => ({
                ...current,
                ascending: event.target.value === 'ascending'
              }))
            }}
          >
            <option value="ascending">Ascending</option>
            <option value="descending">Descending</option>
          </select>
        </label>
        <span className="table-record-count" role="status">
          {rows.length} record{rows.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="table-wrap" role="region" aria-label={caption} tabIndex={0}>
        <table role="table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr role="row">
              {headings.map((heading, index) => (
                <th
                  className={
                    /amount/i.test(heading)
                      ? 'table-number'
                      : /^actions?$/i.test(heading)
                        ? 'table-actions-heading'
                        : undefined
                  }
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
            {rows.length ? (
              rows.map((row) =>
                cloneElement(
                  row,
                  { role: 'row' },
                  Children.toArray(row.props.children).map((cell, index) =>
                    isValidElement(cell)
                      ? cloneElement(
                          cell,
                          {
                            role: 'cell',
                            'data-label': headings[index],
                            className: [
                              cell.props.className,
                              /amount/i.test(headings[index]) ? 'table-number' : ''
                            ]
                              .filter(Boolean)
                              .join(' ')
                          },
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
    </div>
  )
}
