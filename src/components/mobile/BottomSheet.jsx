import Dialog from '../Dialog'

// Reuse native modal focus, backdrop dismissal and Escape handling.
export default function BottomSheet(props) {
  return <Dialog {...props} sheet />
}
