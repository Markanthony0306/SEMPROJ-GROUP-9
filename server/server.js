import { createFitPulseApp } from './bootstrap/createFitPulseApp.js'

const { app, port, accountSeedWorkflow, startReminders } = createFitPulseApp()

export const serverReady = accountSeedWorkflow.run()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`FitPulse API listening on ${port}`)
      try {
        server.once('close', startReminders())
      } catch (error) {
        // A mail configuration problem must leave the rest of the API available.
        console.error('Automatic membership reminders paused:', error.message)
      }
    })
    return server
  })
  .catch((error) => {
    console.error('Failed to start FitPulse API:', error.message)
    process.exit(1)
  })
