import { PilhaAba } from '@/components/PilhaAba';

export default function BibliotecaLayout() {
  return (
    <PilhaAba
      tituloInicial="Biblioteca"
      telas={[
        { nome: 'temas', titulo: 'Temas' },
        { nome: 'acervo', titulo: 'Acervo' },
        { nome: 'tema/[slug]', titulo: 'Tema' },
        { nome: 'topico/[id]', titulo: 'Tópico' },
        { nome: 'topico/novo', titulo: 'Novo tópico', modal: true },
        { nome: 'artigo/[id]', titulo: 'Artigo' },
        { nome: 'artigo/editor', titulo: 'Editor de artigo' },
        { nome: 'meus-artigos', titulo: 'Meus artigos' },
        { nome: 'revisao/index', titulo: 'Fila de revisão' },
        { nome: 'revisao/[id]', titulo: 'Revisar artigo' },
        { nome: 'trilha/[id]', titulo: 'Trilha' },
        { nome: 'trilha/montar', titulo: 'Montar trilha' },
        { nome: 'trilha/concluida', titulo: 'Trilha concluída', modal: true },
      ]}
    />
  );
}
