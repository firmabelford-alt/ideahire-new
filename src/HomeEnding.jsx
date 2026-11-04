export default function HomeEnding({ en = false }) {
  return <section className="ih-home-ending" aria-labelledby="ih-home-ending-title" data-no-translate="true">
    <p className="ih-home-ending-kicker">IdeaHire</p>
    <h2 id="ih-home-ending-title">
      <span>{en ? 'From “I have an idea”' : 'Od „mam pomysł”'}</span>
      <span>{en ? 'to “it’s done”.' : 'do „zrobione”.'}</span>
    </h2>
    <p className="ih-home-ending-note">{en ? 'Find someone to help you take the next step.' : 'Znajdź osobę, z którą zrobisz pierwszy krok.'}</p>
  </section>;
}
