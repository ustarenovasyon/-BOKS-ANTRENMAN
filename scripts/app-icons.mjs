import {mkdir,writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {join} from 'node:path';
const glyphs=['11110/10001/10001/11110/10001/10001/11110','01110/10001/10001/10001/10001/10001/01110','10001/10001/01010/00100/01010/10001/10001'].map(g=>g.split('/'));
const crc=data=>{let n=0xffffffff;for(const byte of data){n^=byte;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;};
function chunk(type,data){const name=Buffer.from(type),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([len,name,data,sum]);}
export async function createAppIcons(root) {
 await mkdir(join(root,'icons'),{recursive:true});
 for(const size of [192,512]){
  const pixels=Buffer.alloc((size*4+1)*size),unit=size/24;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   let color=[15,23,42];const gx=(x-3.5*unit)/unit,gy=(y-9*unit)/unit;
   if(y>=5*unit&&y<6*unit&&x>=3.5*unit&&x<20.5*unit)color=[239,68,68];
   if(gy>=0&&gy<7&&gx>=0&&gx<17){const letter=Math.floor(gx/6),col=Math.floor(gx%6);if(letter<3&&col<5&&glyphs[letter][Math.floor(gy)][col]==='1')color=[255,255,255];}
   const offset=y*(size*4+1)+1+x*4;pixels.set([...color,255],offset);
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  await writeFile(join(root,`icons/icon-${size}.png`),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));
 }
}
