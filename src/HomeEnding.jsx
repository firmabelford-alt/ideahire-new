import { Link } from 'react-router-dom';
import { BrandMark } from './Brand';
import { ArrowIcon } from './InterfaceIcons';

export default function HomeEnding({ en = false }) {
  return <section className="ih-home-ending" aria-labelledby="ih-home-ending-title" data-no-translate="true">
    <div className="ih-home-ending-copy">
      <p className="ih-home-ending-kicker">{en ? 'Your idea. Our kind of people.' : 'Twój pomysł. Ludzie, z którymi ruszysz dalej.'}</p>
      <h2 id="ih-home-ending-title">{en ? 'Start with a conversation.' : 'Zacznij od rozmowy.'}</h2>
      <p>{en ? 'You don’t need to have every detail worked out. Tell people what you have in mind, find the right person and take the next step together.' : 'Nie musisz mieć wszystkiego rozpisanego. Opowiedz, co chcesz zrobić, poznaj właściwą osobę i zróbcie razem następny krok.'}</p>
      <div className="ih-home-ending-actions"><Link className="is-primary" to="/find-talent">{en ? 'Tell us about your project' : 'Opisz swój projekt'}<ArrowIcon/></Link><Link to="/jobs">{en ? 'Find work for your skills' : 'Znajdź coś dla siebie'}<ArrowIcon/></Link></div>
    </div>
    <div className="ih-home-ending-sign" aria-hidden="true"><BrandMark/><span>{en ? 'Good things start with people.' : 'Dobre rzeczy zaczynają się od ludzi.'}</span></div>
  </section>;
}
