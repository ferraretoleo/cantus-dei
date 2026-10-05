export const salmos = [
  {
    referencia:'Salmo 95(96),1',
    texto:'Cantai ao Senhor um cântico novo.',
    tema:'Louvor'
  },
  {
    referencia:'Salmo 150,3-5',
    texto:'Louvai-o ao som da trombeta, da harpa e da cítara.',
    tema:'Música'
  },
  {
    referencia:'Salmo 32(33),3',
    texto:'Cantai para ele um cântico novo; tocai com arte e alegria.',
    tema:'Ministério'
  },
  {
    referencia:'Salmo 97(98),4',
    texto:'Aclamai o Senhor, terra inteira; exultai e cantai.',
    tema:'Celebração'
  },
  {
    referencia:'Salmo 56(57),8',
    texto:'Meu coração está firme; quero cantar e salmodiar.',
    tema:'Entrega'
  },
  {
    referencia:'Salmo 103(104),33',
    texto:'Cantarei ao Senhor enquanto eu viver.',
    tema:'Vocação'
  },
  {
    referencia:'Salmo 146(147),1',
    texto:'Como é bom cantar ao nosso Deus.',
    tema:'Comunhão'
  }
];

export function hojeSaoPaulo() {
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'America/Sao_Paulo',
    year:'numeric',
    month:'2-digit',
    day:'2-digit'
  }).formatToParts(new Date());

  const get=(type:string)=>
    parts.find(p=>p.type===type)?.value || '';

  return {
    ano:Number(get('year')),
    mes:Number(get('month')),
    dia:Number(get('day')),
    chave:`${get('year')}-${get('month')}-${get('day')}`
  };
}

export function salmoDoDiaServidor() {
  const hoje=hojeSaoPaulo();
  const inicio=Date.UTC(hoje.ano,0,1);
  const atual=Date.UTC(hoje.ano,hoje.mes-1,hoje.dia);
  const indice=Math.floor((atual-inicio)/86400000) % salmos.length;
  return salmos[indice];
}
