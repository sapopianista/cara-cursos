import { Link } from 'react-router-dom';

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="text-2xl font-bold tracking-tight" aria-label="Cara Cursos - início">
      Cara <span className="text-lilac">Cursos</span>
    </Link>
  );
}
