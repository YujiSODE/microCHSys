/*microCHSys
* microCHSys.js
*===================================================================
*	Copyright (c) 2023 Yuji SODE <yuji.sode@gmail.com>
*
*	This software is released under the MIT License.
*	See LICENSE or http://opensource.org/licenses/mit-license.php
*===================================================================
* Tool to extract contour from a image using micro Convex Hull System (microCHSys).
*
*===================================================================
*/
/*
* [to contour] 
* - `microCHSys.getContour(srcCanvasId,standard);`
* - `microCHSys.getContour(srcCanvasId,standard,hexColor);`
* ------------------------------------------------------------------
*
* [parameters] 
* 	- `srcCanvasId`: id of target canvas element to scan
* 	- `standard`: a standard value, which is in the range of [0.0,1.0]
* 	- `hexColor`: an optional rgb(a) color value in '#rgb(a)' or '#rrggbb(aa)'
*/
//===================================================================
//it returns object: {srcId: target canvas id, width: target canvas width, height: target canvas height, log: scan log}
function microCHSys(srcCanvasId,standard,hexColor){
	// - srcCanvasId: id of target canvas element to scan
	// - standard: a standard value, which is in the range of [0.0,1.0]
	// - hexColor: an optional rgb(a) color value in '#rgb(a)' or '#rrggbb(aa)'
	//===
	//
	let slf=window,srcCanvas=slf.document.getElementById(srcCanvasId),
		/* width and height of target canvas element */
		w=srcCanvas.width,h=srcCanvas.height,
		/* rgba color array and hex color parser */
		color=[],hexToRGBA=()=>{};
	//
	//--- hex color parser ---
	//returned value is an array and its element is a number in [0, 255] or NaN
	hexToRGBA=!hexColor?0:hexC=>{
		// - hexC: rgb(a) color value in '#rgb(a)' or '#rrggbb(aa)'
		//===
		hexC=hexC.replace('#','');
		let L=hexC.length,v,rgba=[];
		//
		//L = ideally 3, 4, 6 or 8
		if(L<5){
			//
			//L = 3 or 4
			v=hexC.slice(0,1);
			rgba.push(parseInt(v+v,16));
			v=hexC.slice(1,2);
			rgba.push(parseInt(v+v,16));
			v=hexC.slice(2,3);
			rgba.push(parseInt(v+v,16));
			v=hexC.slice(3,4);
			rgba.push(parseInt(v+v,16));
		}else{
			//
			//L = 6 or 8
			rgba.push(parseInt(hexC.slice(0,2),16));
			rgba.push(parseInt(hexC.slice(2,4),16));
			rgba.push(parseInt(hexC.slice(4,6),16));
			rgba.push(parseInt(hexC.slice(6,8),16));
		}
		//
		L=v=null;
		//
		return rgba;
	};
	//
	standard=standard<0.0?0:+standard;
	standard=standard>1.0?1:+standard;
	//
	color=!hexColor?0:hexToRGBA(hexColor);
	//
	//=== script for worker ===
	let scpt=[
		/*== head part of eventlistener ==*/
		"self.addEventListener('message',",
		/*== dealing with pixel data ==*/
		`e=>{let d=e.data.data,W=${Math.floor(w)},H=${Math.floor(h)},N=${Math.floor(w*h)*4.0},std=${255.0*standard},i=0,j=0,R=[],w4=W*4.0,xy0=[],xy=()=>{},`,
			"B=0b00000000,B129=0b10000001,B66=0b01000010,B36=0b00100100,B24=0b00011000,B162=0b10100010,B140=0b10001100,B69=0b01000101,B49=0b00110001,B81=0b01010001,B76=0b01001100,B138=0b10001010,B50=0b00110010,B0=0b00000000;",
		/* function xy returns an array of [xIndex,yIndex]; where idx = 0, 1, 2, ... */
		"xy=idx=>{let XY=[],block=0;XY.push(idx%w4);block=Math.floor(idx/w4);XY.push(block%H);block=null;return XY;};",
		/*
		* +++ "micro Convex Hull System (micro C. H. Sys.)" +++
		*
		* Moore neighborhood: c0 and c1 to c8
		* [c1|c2|c3]
		* [c4|c0|c5]
		* [c6|c7|c8]
		*
		* 8-bit patterns in the micro Convex Hull system, when c0 is in a convex hull excluding its apices
		* [when c0 = 1 and  linear]
		* B = B129       B = B66        B = B36        B = B24
		* B: 0b10000001, B: 0b01000010, B: 0b00100100, B: 0b00011000
		* 100__________  010__________  001__________  000__________
		* 010__________, 010__________, 010__________, 111__________
		* 001__________  010__________  100__________  000__________
		*
		* [when c0 = 1 and nonlinear]
		* B = B162       B = B140       B = B69        B = B49
		* B: 0b10100010, B: 0b10001100, B: 0b01000101, B: 0b00110001
		* 101__________  100__________  010__________  001__________
		* 010__________, 011__________, 010__________, 110__________,
		* 010__________  100__________  101__________  001__________
		*
		* B = B81        B = B76        B = B138       B = B50
		* B: 0b01010001, B: 0b01001100, B: 0b10001010, B: 0b00110010
		* 010__________  010__________  100__________  001__________
		* 110__________, 011__________, 011__________, 110__________
		* 001__________  100__________  010__________  010__________
		*
		* [when c0 = 1 and areal]
		* B = B0
		* B: 0b00000000
		* 000__________
		* 010__________
		* 000__________
		*/
		/*========================*/
		"while(i<N){",
			/* c0 */
			/* RGBA: (r,g,b,a) = (i,i+1,i+2,i+3) */
		"	B=0b00000000;xy0=xy(i);",
			/* c1: when y>0&&x>0 */
		"	j=i-w4-4;B|=xy0[1]>0&&xy0[0]>0?(Math.sqrt(Math.max((d[j]-d[i])**2,(d[j+1]-d[i+1])**2,(d[j+2]-d[i+2])**2,(d[j+3]-d[i+3])**2))>std?0b10000000:0):0;",
			/* c2: when y>0 */
		"	j=i-w4;B|=xy0[1]>0?(Math.sqrt(Math.max((d[j]-d[i])**2,(d[j+1]-d[i+1])**2,(d[j+2]-d[i+2])**2,(d[j+3]-d[i+3])**2))>std?0b01000000:0):0;",
			/* c3: when y>0&&x<w4-1 */
		"	j=i-w4+4;B|=xy0[1]>0&&xy0[0]<w4-1?(Math.sqrt(Math.max((d[j]-d[i])**2,(d[j+1]-d[i+1])**2,(d[j+2]-d[i+2])**2,(d[j+3]-d[i+3])**2))>std?0b00100000:0):0;",
			/* c4: when x>0 */
		"	j=i-4;B|=xy0[0]>0?(Math.sqrt(Math.max((d[j]-d[i])**2,(d[j+1]-d[i+1])**2,(d[j+2]-d[i+2])**2,(d[j+3]-d[i+3])**2))>std?0b00010000:0):0;",
			/* c5: when x<w4-1 */
		"	j=i+4;B|=xy0[0]<w4-1?(Math.sqrt(Math.max((d[j]-d[i])**2,(d[j+1]-d[i+1])**2,(d[j+2]-d[i+2])**2,(d[j+3]-d[i+3])**2))>std?0b00001000:0):0;",
			/* c6: when y<H-1&&x>0 */
		"	j=i+w4-4;B|=xy0[1]<H-1&&xy0[0]>0?(Math.sqrt(Math.max((d[j]-d[i])**2,(d[j+1]-d[i+1])**2,(d[j+2]-d[i+2])**2,(d[j+3]-d[i+3])**2))>std?0b00000100:0):0;",
			/* c7: when y<H-1 */
		"	j=i+w4;B|=xy0[1]<H-1?(Math.sqrt(Math.max((d[j]-d[i])**2,(d[j+1]-d[i+1])**2,(d[j+2]-d[i+2])**2,(d[j+3]-d[i+3])**2))>std?0b00000010:0):0;",
			/* c8: when y<H-1&&x<w4-1 */
		"	j=i+w4;B|=xy0[1]<H-1&&xy0[0]<w4-1?(Math.sqrt(Math.max((d[j]-d[i])**2,(d[j+1]-d[i+1])**2,(d[j+2]-d[i+2])**2,(d[j+3]-d[i+3])**2))>std?0b00000001:0):0;",
		/* ------------ */
		" 	if(B&B129^B129&&B&B66^B66&&B&B36^B36&&B&B24^B24&&B&B162^B162&&B&B140^B140&&B&B69^B69&&B&B49^B49&&B&B81^B81&&B&B76^B76&&B&B138^B138&&B&B50^B50&&B^B0){",
		 		/* a given cell is not in the convex hull */
		!color?"R.push(d[i],d[i+1],d[i+2],d[i+3]);":`R.push(${Number.isNaN(color[0])?255:color[0]},${Number.isNaN(color[1])?255:color[1]},${Number.isNaN(color[2])?255:color[2]},${Number.isNaN(color[3])?255:color[3]});`,
				/*a given cell is in the convex hull */
		"	}else{R.push(0,0,0,0);}",
		"	i+=4;}",
		/*========================*/
		/*== return result: returned value is an array ==*/
		"self.postMessage(R);d=W=H=N=std=i=j=w4=xy0=xy=B=B129=B66=B36=B24=B162=B140=B69=B49=B81=B76=B138=B50=B0=R=null;},",
		/*== tail part of eventlistener ==*/
		"true);"
	].join('');
	//
	//=== generation of worker ===
	//
	let blob=new Blob([scpt],{type:'text/javascript'}),
		objUrl=slf.URL.createObjectURL(blob),
		wk=new Worker(objUrl);
	slf.URL.revokeObjectURL(objUrl);
	blob=objUrl=null;
	//
	//========================================
	//
	let F=()=>{
		//###############
		let obj={srcId:srcCanvasId,width:w,height:h,log:[]};
		//##############
		wk.addEventListener('message',e=>{
			obj.log=e.data;
			wk.terminate();
			srcCanvas=null;
		},true);
		//
		/* wk.addEventListener('error',e=>{console.log(e);},true); */
		//
		wk.postMessage(srcCanvas.getContext('2d').getImageData(+0,+0,+w,+h));
		//
		return obj;
	};
	//========================================
	//
	//returned value is an object: {srcId: target canvas id, width: target canvas width, height: target canvas height, log: scan log}
	return F();
};
//
//method to draw contour
microCHSys.getContour=async (srcCanvasId,standard,hexColor)=>{
	// - srcCanvasId: id of target canvas element to scan
	// - standard: a standard value, which is in the range of [0.0,1.0]
	// - hexColor: an optional rgb(a) color value in '#rgb(a)' or '#rrggbb(aa)'
	//===
	let LOG=await microCHSys(srcCanvasId,standard,hexColor),
		slf=window,
		srcCanvas=slf.document.getElementById(srcCanvasId),
		outputId=`${srcCanvasId}_OUTPUT`,
		outputCanvas=slf.document.getElementById(outputId),
		ctx={},n=0,i=0,img={};
	//
	if(!outputCanvas){
		outputCanvas=slf.document.createElement('canvas');
		outputCanvas.id=outputId;
		slf.document.getElementById(srcCanvasId).parentNode.appendChild(outputCanvas);
	}
	//
	setTimeout(()=>Promise.resolve(LOG).then((v)=>{
		ctx=outputCanvas.getContext('2d');
		outputCanvas.width=+v.width;
		outputCanvas.height=+v.height;
		//
		//to generate image data
		img=ctx.createImageData(+outputCanvas.width,+outputCanvas.height);
		n=img.data.length;
		//
		//n = 4*width*height
		while(i<n){
			//R value
			img.data[i]=v.log[i];
			//G value
			img.data[i+1]=v.log[i+1];
			//B value
			img.data[i+2]=v.log[i+2];
			//A value
			img.data[i+3]=v.log[i+3];
			//
			i+=4;
		}
		//
		//to put image data
		ctx.putImageData(img,0,0);
		//
		LOG=slf=outputId=outputCanvas=ctx=n=i=img=null;
		//
	}),2000);
};
//
