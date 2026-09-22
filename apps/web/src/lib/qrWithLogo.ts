import QRCode from 'qrcode';

function carregarImagem(
  src:string
):Promise<HTMLImageElement> {
  return new Promise(
    (resolve,reject)=>{
      const img=
        new Image();

      img.onload=
        ()=>resolve(img);

      img.onerror=
        ()=>reject(
          new Error(
            'Não foi possível carregar a logo.'
          )
        );

      img.src=src;
    }
  );
}

export async function qrComLogo(
  conteudo:string,
  logoData?:string|null,
  tamanho=520
) {
  const canvas=
    document.createElement(
      'canvas'
    );

  canvas.width=tamanho;
  canvas.height=tamanho;

  await QRCode.toCanvas(
    canvas,
    conteudo,
    {
      width:tamanho,
      margin:3,
      errorCorrectionLevel:'H',
      color:{
        dark:'#111111',
        light:'#ffffff'
      }
    }
  );

  if (!logoData) {
    return canvas.toDataURL(
      'image/png'
    );
  }

  try {
    const logo=
      await carregarImagem(
        logoData
      );

    const ctx=
      canvas.getContext(
        '2d'
      );

    if (!ctx) {
      return canvas.toDataURL(
        'image/png'
      );
    }

    const area=
      Math.round(
        tamanho*0.22
      );

    const centro=
      tamanho/2;

    const fundo=
      area+24;

    ctx.fillStyle='#ffffff';

    ctx.fillRect(
      centro-fundo/2,
      centro-fundo/2,
      fundo,
      fundo
    );

    const proporcao=
      Math.min(
        area/logo.width,
        area/logo.height
      );

    const w=
      logo.width*proporcao;

    const h=
      logo.height*proporcao;

    ctx.drawImage(
      logo,
      centro-w/2,
      centro-h/2,
      w,
      h
    );
  } catch {
    // Se a logo falhar, mantém o QR válido sem ela.
  }

  return canvas.toDataURL(
    'image/png'
  );
}
