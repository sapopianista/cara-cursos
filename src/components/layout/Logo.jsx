import { Link } from 'react-router-dom';

export default function Logo({ to = '/', onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-lg text-2xl font-bold tracking-tight"
      aria-label="Cara Cursos — página inicial"
    >
      Cara <span className="text-lilac">Cursos</span>
    </Link>
  );
}
