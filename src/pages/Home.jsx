const programs = [
  [
    'Strength',
    'Build a strong foundation with purposeful resistance training.',
    '/images/barbell.jpg'
  ],
  ['Conditioning', 'Move better, recover faster, and turn up your endurance.', '/images/gym.jpg'],
  ['Personal coaching', 'A plan shaped around your pace, goals, and life.', '/images/arnold.jpg']
]
export default function Home({ navigate }) {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Move with purpose</p>
          <h1>
            Find your
            <br />
            <em>stronger pulse.</em>
          </h1>
          <p>
            Fitness management that makes showing up, tracking progress, and building momentum feel
            effortless.
          </p>
          <button className="button" onClick={() => navigate('register')}>
            Start your journey <span>→</span>
          </button>
        </div>
      </section>
      <section className="programs section" id="programs">
        <p className="eyebrow">Find your rhythm</p>
        <h2>
          Training for every
          <br />
          kind of strong.
        </h2>
        <div className="program-grid">
          {programs.map(([title, copy, image]) => (
            <article
              className="program-card"
              key={title}
              style={{ backgroundImage: `linear-gradient(0deg,#0d0e10e8,#0d0e1033),url(${image})` }}
            >
              <h3>{title}</h3>
              <p>{copy}</p>
              <button onClick={() => navigate('register')}>Explore program →</button>
            </article>
          ))}
        </div>
      </section>
      <section className="statement section">
        <div>
          <p className="eyebrow">The FitPulse difference</p>
          <h2>
            No guesswork.
            <br />
            <em>Just momentum.</em>
          </h2>
        </div>
        <p>
          From simple check-ins to membership reminders, FitPulse gives your gym community one
          focused place to keep progress moving.
        </p>
      </section>
    </main>
  )
}
