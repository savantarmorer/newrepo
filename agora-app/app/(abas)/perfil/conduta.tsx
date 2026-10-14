import { MarkdownView } from '@/components/MarkdownView';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useMeuPerfil } from '@/features/perfil/hooks';
import { CODIGO_DE_CONDUTA, VERSAO_CODIGO } from '@/lib/codigoConduta';
import { formatarDataLonga } from '@/lib/formatos';

export default function Conduta() {
  const { data: perfil } = useMeuPerfil();
  return (
    <Tela>
      <Texto variante="titulo">Código de Conduta</Texto>
      <Texto variante="legenda" cor="sutil">Versão {VERSAO_CODIGO}{perfil?.aceitou_codigo_conduta_em ? ` · você aceitou em ${formatarDataLonga(perfil.aceitou_codigo_conduta_em)}` : ''}</Texto>
      <MarkdownView texto={CODIGO_DE_CONDUTA} leitura />
    </Tela>
  );
}
