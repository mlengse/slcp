exports._upsertData = async ({ that }) => {
  if(that.config.ARANGODB_DB) for(let [konfirmId, konfirm] of that.listConfirms.entries()) {
    let confirmData = await that.arangoUpsert({
      coll: 'konfirm',
      doc: Object.assign({}, konfirm, {
        _key: `${konfirm.kelurahan}_${konfirm.no}`
      })
    })
    that.listConfirms[konfirmId] = confirmData.NEW

    for(let [konterId, konter] of that.listKonters.entries()) if(konter.nama_indeks_kasus === konfirm.no && konter.kelurahan === konfirm.kelurahan) {
      let konterData = await that.arangoUpsert({
        coll: 'konter',
        doc: Object.assign({}, konter, {
          _key: konter.nik
        })
      })

      that.listKonters[konterId] = konterData.NEW
    }
  }

}

exports._cleanData = async ({ that }) => {

  that.listConfirms = that.listConfirms.map( confirm => {
    Object.keys(confirm).map( k => {
      // if(k.includes('alamat') 
        // || k.includes('jk') 
        // || k.includes('umur') 
      // ){
        // delete confirm[k]
      // }
      if(k.includes('rujukan')){
        confirm.tindakan = confirm[k]
        delete confirm[k]
      }
      if(k.includes('gejala')){
        confirm.gejala = confirm[k]
        delete confirm[k]
      }
    })

    // console.log(confirm)
    
    if(confirm.tindakan && (confirm.tindakan.toLowerCase().includes('sembuh') || confirm.tindakan.toLowerCase().includes('ninggal'))){
      confirm.no_hp = '08562508060'
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
      // if(k.includes('alamat') 
        // || k.includes('jk') 
        // || k.includes('umur') 
        // || k.includes('usia') 
        // || k.includes('lahir') 
      // ){
        // delete konter[k]
      // }
    })
    return konter
  }).filter( konter => Number(konter.nama_indeks_kasus) == konter.nama_indeks_kasus)


}


exports._cariConfirmByNIK = async ({ that, nik }) => {
  await that.page.waitForSelector('input#nik')

  let [hapus] = await that.page.$x("//button[contains(., 'Hapus')]");
  if(hapus){
    await hapus.click();
  }

  // await that.page.type('input#nik', '3372026504730002')
  await that.page.type('input#nik', nik)
  let [filter] = await that.page.$x("//button[contains(., 'Filter')]");
  while(!filter){
    [filter] = await that.page.$x("//button[contains(., 'Filter')]");
  }

  await filter.click()
  await that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
  let [table] = await that.page.$x("//table[contains(., 'Nama')]")
  while(!table){
    [table] = await that.page.$x("//table[contains(., 'Nama')]")
  }
  let exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, nik)
  // console.log(confirmData.nik, exists)

  return exists

}