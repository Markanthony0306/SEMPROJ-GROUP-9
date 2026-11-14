import { createFitPulseApp } from './bootstrap/createFitPulseApp.js'

const { app, port, accountSeedWorkflow } = createFitPulseApp()

export const serverReady = accountSeedWorkflow.run()
  .then(() => {
    const server = app.listen(port, () => console.log(`FitPulse API listening on ${port}`))
    return server
  })
  .catch((error) => {
    console.error('Failed to start FitPulse API:', error.message)
    process.exit(1)
  })
