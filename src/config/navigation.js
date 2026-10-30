import {
  BarChart3,
  CircleHelp,
  Compass,
  Headset,
  House,
  LayoutDashboard,
  Route,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * Menus laterais. Para criar uma nova tela: adicione o item aqui e a <Route>
 * correspondente em src/App.jsx. `permissao` (ver AuthContext) esconde o item
 * de quem não pode acessá-lo.
 */
export const menuAluno = {
  secoes: [
    {
      titulo: null,
      itens: [
        { rotulo: 'Início', to: '/', icone: House, end: true },
        { rotulo: 'Explorar', to: '/explorar', icone: Compass },
        { rotulo: 'Trilhas', to: '/trilhas', icone: Route },
        { rotulo: 'Meu progresso', to: '/progresso', icone: TrendingUp },
      ],
    },
  ],
  rodape: [{ rotulo: 'Suporte', to: '/suporte', icone: Headset }],
};

export const menuAdmin = {
  secoes: [
    {
      titulo: 'Acompanhamento',
      itens: [
        { rotulo: 'Visão geral', to: '/admin', icone: LayoutDashboard, end: true, permissao: 'admin.visao' },
        {
          rotulo: 'Colaboradores',
          to: '/admin/colaboradores',
          icone: Users,
          permissao: 'admin.colaboradores',
        },
        { rotulo: 'Relatórios', to: '/admin/relatorios', icone: BarChart3, permissao: 'admin.relatorios' },
      ],
    },
    {
      titulo: 'Empresa',
      itens: [
        {
          rotulo: 'Gestores e permissões',
          to: '/admin/gestores',
          icone: ShieldCheck,
          permissao: 'admin.gestores',
        },
        {
          rotulo: 'Plano e faturamento',
          to: '/admin/faturamento',
          icone: Wallet,
          permissao: 'admin.faturamento',
        },
        {
          rotulo: 'Configurações',
          to: '/admin/configuracoes',
          icone: Settings,
          permissao: 'admin.configuracoes',
        },
      ],
    },
  ],
  rodape: [{ rotulo: 'Ajuda', to: '/admin/ajuda', icone: CircleHelp, permissao: 'admin.ajuda' }],
};

/** Primeira tela do painel que o papel pode abrir (ex.: Financeiro cai em Faturamento). */
export const inicioAdmin = (pode) =>
  menuAdmin.secoes.flatMap((s) => s.itens).find((i) => pode(i.permissao))?.to ?? '/admin/ajuda';
