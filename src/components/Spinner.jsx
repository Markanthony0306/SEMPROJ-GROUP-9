export default function Spinner({ large = false }) {
  return <span className={large ? 'spinner spinner-large' : 'spinner'} aria-hidden="true" />
}
