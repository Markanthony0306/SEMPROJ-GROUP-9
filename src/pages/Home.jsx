import Reveal from '../components/Reveal'
import { assetUrl } from '../utils/assets'

const programs = [
  [
    'Strength',
    'Build a strong foundation with purposeful resistance training.',
    '/images/barbell.jpg'
  ],
  ['Conditioning', 'Move better, recover faster, and turn up your endurance.', '/images/gym.jpg'],
  ['Personal coaching', 'A plan shaped around your pace, goals, and life.', '/images/arnold.jpg']
]
const coaches = [
  [
    'Ariana Santos',
    'Strength & mobility',
    'Build confidence in every rep with form-first coaching.',
    '/images/cat-sawag.jpg'
  ],
  [
    'Marco Reyes',
    'Performance conditioning',
    'Sustainable sessions designed around your real-life goals.',
    '/images/cat-serious.jpg'
  ]
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
        <Reveal>
          <p className="eyebrow">Find your rhythm</p>
          <h2>
            Training for every
            <br />
            kind of strong.
          </h2>
        </Reveal>
        <div className="program-grid">
          {programs.map(([title, copy, image], index) => (
            <Reveal key={title} delay={index * 90}>
              <article className="program-card glass-card">
              <img src={assetUrl(image)} alt="" />
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <button onClick={() => navigate('register')}>Explore program →</button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="coaching section" id="coaching">
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Meet the team</p>
              <h2>
                Coaching with
                <br />
                <em>your goals in mind.</em>
              </h2>
            </div>
            <p>
              Thoughtful guidance, meaningful progress, and a coach who meets you where you are.
            </p>
          </div>
        </Reveal>
        <div className="coach-grid">
          {coaches.map(([name, specialty, bio, image], index) => (
            <Reveal key={name} delay={index * 110}>
              <article className="coach-card glass-card">
              <img src={assetUrl(image)} alt={`${name}, FitPulse coach`} />
                <div>
                  <p className="eyebrow">{specialty}</p>
                  <h3>{name}</h3>
                  <p>{bio}</p>
                  <button onClick={() => navigate('register')}>
                    Train with {name.split(' ')[0]} →
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <Reveal>
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
      </Reveal>
    </main>
  )
}
