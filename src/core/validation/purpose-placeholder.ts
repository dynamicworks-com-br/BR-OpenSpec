import { buildCodeFenceMask } from '../parsers/code-fence.js';
import { PURPOSE_PLACEHOLDER_PREFIX, PURPOSE_PLACEHOLDER_SUFFIX } from './constants.js';

/**
 * Detecta um `## Purpose` que ainda é um placeholder, e não um Purpose que
 * alguém escreveu.
 *
 * Quando um delta introduz uma capability sem um `## Purpose` utilizável, o
 * archive carimba o placeholder no novo spec principal. Esse texto passa de
 * `MIN_PURPOSE_LENGTH`, então a checagem de brevidade não o alcança: a única
 * regra que existe para pegar um Purpose que ninguém escreveu é satisfeita
 * exatamente pela frase que significa que ninguém o escreveu. Nada mais o lê
 * depois, então a capability fica com um "a fazer" dentro enquanto todo comando
 * reporta sucesso.
 *
 * Duas coisas contam, e deliberadamente nada mais:
 *
 * - o placeholder que esta ferramenta gera, reconhecido pelas mesmas constantes
 *   com que o escritor o compõe, onde quer que esteja no Purpose — ninguém
 *   digita essa frase por acidente;
 * - um `A definir`, `TBD` ou `TODO` **abrindo** o Purpose, que é o marcador
 *   deixado para trás quando alguém é instruído a deixar "um placeholder breve"
 *   e nunca volta. Qual das palavras foi digitada não diz nada sobre o Purpose
 *   ter sido escrito, então todas são lidas do mesmo jeito. `A definir` é o
 *   termo que o fork usa no próprio placeholder, no schema.yaml e nos docs
 *   PT-BR; `TBD`/`TODO` cobrem a guidance do upstream e projetos migrados dele.
 *
 * Um marcador no meio de uma frase é deixado em paz. "O orçamento de retry é
 * TBD pendente de benchmarks" é um Purpose real com uma pergunta em aberto, e
 * reportá-lo ensinaria as pessoas a ignorar o aviso — o que custa mais do que
 * as findings que acrescentaria.
 *
 * Código cercado (fence) dentro do Purpose é citação, não o Purpose falando,
 * então é removido antes. Sem isso, um Purpose que documenta a frase que o
 * archive grava seria reportado como sendo essa frase: um documento sobre o
 * placeholder falhando por carregá-lo.
 */

export interface PurposePlaceholderIssue {
  /** Linha (1-based) do texto do placeholder, quando localizável. */
  line?: number;
}

/**
 * Um `A definir`, `TBD` ou `TODO` abrindo o Purpose. O lookahead o mantém fora
 * de uma palavra mais longa que só começa com essas letras, como "TBDs",
 * "TODOs" ou "A definirmos", mas ainda permite a pontuação com que um marcador
 * costuma ser escrito: `TODO:`, `TBD -`, `A definir.`. Rejeita qualquer letra,
 * dígito ou marca combinante, e não só os ASCII que `\b` conhece, porque um
 * Purpose é prosa e prosa nem sempre é escrita em alfabeto latino — `TBD`
 * seguido de um dígito indo-arábico é tão palavra maior quanto "TBDs".
 */
const LEADING_MARKER = /^(?:TBD|TODO|A definir)(?![\p{L}\p{N}\p{M}_])/iu;

const PURPOSE_HEADER = /^ {0,3}##(?!#)[ \t]+Purpose[ \t]*$/i;
const TOP_LEVEL_HEADER = /^ {0,3}#{1,2}(?!#)[ \t]+/;

/**
 * As linhas de `text` que ficam fora de um bloco de código cercado, com as
 * quebras de linha normalizadas antes.
 *
 * `buildCodeFenceMask` é o mascarador que os parsers de requisito e de
 * estrutura já compartilham, e a própria razão de existir dele é que uma
 * segunda noção privada do que é um fence deriva da primeira. Esta checagem lê
 * Markdown com o mesmo propósito que eles, então lê fences do mesmo jeito.
 */
function unfencedLines(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const fenced = buildCodeFenceMask(lines);
  return lines.filter((_, index) => !fenced[index]);
}

/**
 * Índice do prefixo quando o texto carrega a frase que o archive grava.
 * Casada como as duas metades fixas em ordem, porque o nome da alteração entre
 * elas varia — assim a checagem segue a definição do próprio escritor em vez
 * de uma segunda cópia dela.
 */
function generatedPlaceholderPrefixIndex(text: string): number | undefined {
  let suffixAt = text.indexOf(PURPOSE_PLACEHOLDER_SUFFIX);
  while (suffixAt !== -1) {
    // Usa o prefixo mais próximo antes deste sufixo. Uma explicação autoral
    // pode mencionar o prefixo acima do placeholder real; escolher o primeiro
    // prefixo apontaria o diagnóstico para a explicação em vez do texto que o
    // usuário precisa substituir.
    const prefixAt = text.lastIndexOf(PURPOSE_PLACEHOLDER_PREFIX, suffixAt);
    if (prefixAt !== -1) return prefixAt;
    suffixAt = text.indexOf(PURPOSE_PLACEHOLDER_SUFFIX, suffixAt + 1);
  }
  return undefined;
}

/**
 * Reporta o Purpose de um spec principal como placeholder não escrito, ou null
 * quando ele se lê como conteúdo autoral.
 *
 * Um Purpose vazio não é reportado aqui — `SPEC_PURPOSE_EMPTY` já o cobre, e
 * reportar os dois poria duas findings na mesma linha. Isso decorre das duas
 * regras, sem precisar de um caso próprio.
 */
export function findPurposePlaceholderIssue(
  overview: string,
  content?: string
): PurposePlaceholderIssue | null {
  // Um Purpose vazio não precisa de branch próprio: nenhuma das regras casa
  // texto vazio, então ele cai no null da linha abaixo. Um early return para
  // ele seria uma guarda que nenhum teste consegue segurar, o que é pior que
  // nenhuma. Um Purpose que é só um bloco cercado reduz ao mesmo texto vazio
  // aqui, e fica para as regras de brevidade e de Purpose vazio pela mesma
  // razão.
  const prose = unfencedLines(overview).join('\n').trim();
  const leading = LEADING_MARKER.test(prose);
  if (!leading && generatedPlaceholderPrefixIndex(prose) === undefined) return null;
  // A regra que casou decide onde o placeholder está, então o localizador é
  // informado. Quando as duas casam, o marcador de abertura vence: ele fica na
  // frase gerada ou acima dela, e o marcador mais alto é o que um leitor
  // descendo pelo arquivo encontra primeiro.
  return { line: content === undefined ? undefined : findPlaceholderLine(content, leading) };
}

/**
 * A linha dentro da seção `## Purpose` que carrega o placeholder, para que o
 * aviso aponte para o texto a substituir e não para o arquivo.
 *
 * Qual linha é depende da regra que casou. Um marcador de abertura é, por
 * definição, a primeira linha não vazia da seção. A frase gerada não é: ela
 * pode vir depois de prosa que alguém escreveu, e nomear a primeira linha não
 * vazia apontaria para essa prosa — uma linha que o leitor vê que está bem, o
 * que se lê como a checagem estar errada e não como o Purpose não estar
 * escrito.
 *
 * Linhas cercadas são puladas no caminho, pela razão pela qual a detecção as
 * pula, e para que um `## Requirements` citado dentro de um fence não encerre a
 * seção antes da hora.
 *
 * Undefined quando o placeholder não pode ser localizado — sem cabeçalho de
 * seção, ou uma frase gerada que nenhuma linha isolada carrega. O chamador
 * então reporta a finding sem linha em vez de com uma linha chutada, já que um
 * número de linha errado é pior que nenhum.
 *
 * As quebras de linha são normalizadas antes, para que o mesmo spec reporte a
 * mesma linha tenha sido salvo no Windows ou no macOS/Linux.
 */
function findPlaceholderLine(content: string, leading: boolean): number | undefined {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const fenced = buildCodeFenceMask(lines);
  const headerIndex = lines.findIndex((line, index) => !fenced[index] && PURPOSE_HEADER.test(line));
  if (headerIndex === -1) return undefined;

  const purposeLines: Array<{ line: number; text: string }> = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    if (fenced[i]) continue;
    if (TOP_LEVEL_HEADER.test(lines[i])) break;
    if (leading && lines[i].trim()) return i + 1;
    purposeLines.push({ line: i + 1, text: lines[i] });
  }

  if (leading) return undefined;

  const purpose = purposeLines.map(({ text }) => text).join('\n');
  const prefixAt = generatedPlaceholderPrefixIndex(purpose);
  if (prefixAt === undefined) return undefined;
  const lineOffset = purpose.slice(0, prefixAt).split('\n').length - 1;
  return purposeLines[lineOffset]?.line;
}
