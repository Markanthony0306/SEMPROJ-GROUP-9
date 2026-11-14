export const memberIdTypes = {
  drivers_license: 'Driver’s License',
  passport: 'Passport',
  senior_id: 'Senior Citizen ID',
  sss_id: 'SSS ID',
  pwd_id: 'PWD ID',
  student_id: 'School ID',
  national_id: 'National ID / PhilSys ID'
}

export const memberIdImageTypes = ['image/jpeg', 'image/png']
export const memberIdDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
export const memberIdFileLimit = 5 * 1024 * 1024
export const memberIdImageLimit = memberIdFileLimit
