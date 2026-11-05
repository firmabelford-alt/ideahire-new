export default function HomeEnding({ en = false }) {
  return <div className="ih-home-footer-end" data-no-translate="true">
    <p>{en ? 'Find someone for your project. Or a project for yourself.' : 'Znajdź kogoś do projektu. Albo projekt dla siebie.'}</p>
    <small>© 2026 IdeaHire</small>
  </div>;
}
