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

  that.listConfirms = that.listConfirms.filter(confirm => confirm.nik && confirm.nik.length === 16 && that.filter14(confirm.tgl_onset)).map( confirm => {
    if(!confirm.umur){
      confirm.umur = that.umur(confirm.nik.substring(8, 12)).toString()
    }
    if(!confirm.jk){
      confirm.jk = Number(confirm.nik[6]) > 3 ? 'P' : 'L'    
    }
    confirm.jk = confirm.jk.toLowerCase() === 'l' ? 'Laki' : 'Perempuan'

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
      confirm.no_hp = '082226059060'
    }

    if(confirm.no_hp && confirm.no_hp[0] !== '0'){
      confirm.no_hp = `0${confirm.no_hp}`
    }
    return confirm
  })

  that.listKonters = that.listKonters.filter( konter => konter.nik && konter.nik.length === 16 && Object.keys( konter ).filter( e => e.includes('nama_indeks')).length).map( konter => {
    if(!konter.usia){
      konter.usia = that.umur(konter.nik.substring(8, 12)).toString()
    }
    if(!konter.jk){
      konter.jk = Number(konter.nik[6]) > 3 ? 'P' : 'L'    
    }
    konter.jk = konter.jk.toLowerCase() === 'l' ? 'Laki' : 'Perempuan'
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

    if(!konter.no_hp){
      konter.no_hp = '082226059060'

    }
    if(konter.no_hp && konter.no_hp[0] !== '0'){
      konter.no_hp = `0${konter.no_hp}`
    }
    return konter

  }).filter( konter => Number(konter.nama_indeks_kasus) == konter.nama_indeks_kasus)


}


exports._cariConfirmByNIK = async ({ that, nik }) => {

  let inputNIK = await that.page.$('input#nik')

  if(!inputNIK){
    await that.page.reload()
    await that.page.waitForSelector('input#nik')

  }

  let [hapus] = await that.page.$x("//button[contains(., 'Hapus')]");
  if(hapus){
    await hapus.click();
  }

  // await that.page.type('input#nik', '3372026504730002')
  await that.page.type('input#nik', nik)

  await that.clickBtn({ text: 'Filter'})

  await that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)

  // console.log(JSON.stringify(that.response[that.response.length-1].json))
  let [table] = await that.page.$x("//table[contains(., 'Nama')]")
  while(!table){
    [table] = await that.page.$x("//table[contains(., 'Nama')]")
  }
  let exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, nik)
  // console.log(confirmData.nik, exists)

  return exists

}

exports._cariKonterByNIK = async ({ that, nik }) => {


  // await that.page.waitForTimeout(5000)

  // await that.page.waitForSelector('#nik')
  // await that.page.type('input#nik', '3372026504730002')
  // await that.page.type('#nik', nik)

  // console.log('mau klik')

  // await that.clickBtn({ text: 'Filter'})

  // console.log('filter')

  await that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
  let [table] = await that.page.$x("//table[contains(., 'Nama')]")
  while(!table){
    [table] = await that.page.$x("//table[contains(., 'Nama')]")
  }
  let exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, nik)
  // console.log(confirmData.nik, exists)

  return exists

}