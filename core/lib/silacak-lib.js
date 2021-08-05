exports._cleanData = async ({ that }) => {
  let num = 1

  that.listConfirms = that.listConfirms.map( confirm => {
    Object.keys(confirm).map( k => {
      if(k.includes('alamat') 
        || k.includes('jk') 
        || k.includes('umur') 
      ){
        delete confirm[k]
      }
      if(k.includes('tindakan')){
        confirm.tindakan = confirm[k]
        delete confirm[k]
      }
      if(k.includes('gejala')){
        confirm.gejala = confirm[k]
        delete confirm[k]
      }
    })
    if(confirm.tindakan.toLowerCase().includes('sembuh') || confirm.tindakan.toLowerCase().includes('ninggal')){
      delete confirm.hp
    }
    return confirm
  }).filter(confirm => confirm.nik)

  that.listKonters = that.listKonters.filter( konter => konter.nik && Object.keys( konter ).filter( e => e.includes('nama_indeks')).length).map( konter => {
    if(konter.nama_indeks_kasus.toLowerCase().includes('no')){
      let noIndeksKasus = konter.nama_indeks_kasus.toLowerCase().split('no')
      noIndeksKasus = noIndeksKasus[noIndeksKasus.length-1]
      if(noIndeksKasus.includes('.')){
        noIndeksKasus = noIndeksKasus.split('.').join('')
      }
      noIndeksKasus = noIndeksKasus.trim()
      konter.nama_indeks_kasus = noIndeksKasus
    }
    Object.keys(konter).map( k => {
      if(k.includes('alamat') 
        || k.includes('jk') 
        || k.includes('umur') 
        || k.includes('usia') 
        || k.includes('lahir') 
      ){
        delete konter[k]
      }
    })
    return konter
  }).filter( konter => Number(konter.nama_indeks_kasus) == konter.nama_indeks_kasus)

  that.listConfirms.map( confirm => {
    let konters = that.listKonters.filter( konter => konter.nama_indeks_kasus === confirm.no && konter.kelurahan === confirm.kelurahan)
    if(konters.length){
      console.log(`${num}: ${JSON.stringify(confirm)}`)
      console.log(`konter: ${konters.length}`)
      let numk = 1
      konters.map( konter => {
        console.log(`${num}-${numk}: ${JSON.stringify(konter)}`)
        numk++
      })
      console.log('---------------------------')
      num++
      
    }

  })
  

  // for( let konter of that.listKonters) {
  //   if(konter.nik && Object.keys( konter ).filter( e => e.includes('nama_indeks')).length ) {
  //     let { NEW } = await that.arangoUpsert({
  //       coll: 'konter',
  //       doc: Object.assign({}, konter, {
  //         _key: konter.nik
  //       })
  //     })
  //     if(!NEW.silacak) {
  //       if(Number(NEW.nama_indeks_kasus) == NEW.nama_indeks_kasus) {
  //         let res = await that.arangoUpsert({
  //           coll: 'konfirm',
  //           doc: Object.assign({}, confirm, {
  //             _key: `${confirm.kelurahan}_${confirm.no}`
  //           })
  //         })
  //         if(!res.NEW.silacak && NEW.nik && confirm.nik) {
  //           // push ke silacak
  //           await that.loginSilacak()
  //         }
  //       }
  //     }
  //   }
  // }
}