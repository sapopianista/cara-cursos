import {
  BarChart3,
  Briefcase,
  CircleHelp,
  Flame,
  GraduationCap,
  Headset,
  House,
  LayoutDashboard,
  LayoutGrid,
  Route,
  Settings,
  ThumbsUp,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * Menus laterais. Para criar uma nova tela: adicione o item aqui
 * e a <Route> correspondente em src/App.jsx.
 */
export const menuAluno = [
  {
    titulo: 'Menu',
    itens: [
      { rotulo: 'Início', to: '/', icone: House, end: true },
      { rotulo: 'Destaques', to: '/destaques', icone: Flame },
      { rotulo: 'Recomendados', to: '/recomendados', icone: ThumbsUp },
      { rotulo: 'Contato/Suporte', to: '/suporte', icone: Headset },
      { rotulo: 'Área do aluno', to: '/area-do-aluno', icone: GraduationCap },
    ],
  },
  {
    titulo: 'Categorias',
    itens: [
      { rotulo: 'Todos os cursos', to: '/cursos', icone: LayoutGrid },
      { rotulo: 'Trilhas de carreira', to: '/trilhas', icone: Route },
      { rotulo: 'Por área de atuação', to: '/areas', icone: Briefcase },
      { rotulo: 'Níveis de desenvolvimento', to: '/niveis', icone: TrendingUp },
    ],
  },
];

export const menuAdmin = [
  {
    titulo: 'Menu',
    itens: [
      { rotulo: 'Dashboards', to: '/admin', icone: LayoutDashboard, end: true },
      { rotulo: 'Funcionários', to: '/admin/funcionarios', icone: Users },
      { rotulo: 'Relatórios', to: '/admin/relatorios', icone: BarChart3 },
    ],
  },
  {
    titulo: 'Outros',
    itens: [
      { rotulo: 'Configurações', to: '/admin/configuracoes', icone: Settings },
      { rotulo: 'Pagamento', to: '/admin/pagamento', icone: Wallet },
      { rotulo: 'Contas', to: '/admin/contas', icone: UserCog },
      { rotulo: 'Ajuda', to: '/admin/ajuda', icone: CircleHelp },
    ],
  },
];
