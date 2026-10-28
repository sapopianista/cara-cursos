/** Saudação + uma única linha de contexto sobre a meta semanal. */
export default function WelcomeHeader({ nome, horasEstudadas, horasMeta }) {
  const formatar = (n) => n.toLocaleString('pt-BR');

  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight">Olá, {nome}</h1>
      <p className="mt-2 text-base text-muted">
        Meta semanal: <span className="font-semibold text-ink">{formatar(horasEstudadas)} de {formatar(horasMeta)} horas</span> estudadas.
      </p>
    </header>
  );
}
