export const memberIdTypes = {
  passport: 'Philippine passport',
  drivers_license: 'Philippine driver’s license',
  national_id: 'Philippine National ID',
  student_id: 'Student ID'
}

export const memberIdImageTypes = ['image/jpeg', 'image/png']
export const memberIdDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
export const memberIdFileLimit = 5 * 1024 * 1024
export const memberIdRejectedAttemptLimit = 5
export const memberIdImageLimit = memberIdFileLimit
export const memberIdAttemptLimit = 3
