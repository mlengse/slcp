exports._upsertData = async ({ that }) => {
  that.spinner.start(`upsertData`)
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
  that.spinner.start(`cleanData`)

  that.listConfirms = that.listConfirms.filter(confirm => confirm.nik && confirm.nik.length === 16 && that.filter14(confirm.tgl_onset)).map( confirm => {
    that.spinner.start(`confirm.tgl_onset: ${confirm.tgl_onset}`)
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
  that.spinner.start(`cariConfirmByNIK`)

  let inputNIK = await that.page.$('input#nik')

  while(!inputNIK){
    await that.page.reload()
    await that.page.waitForTimeout(500)
    inputNIK = await that.page.$('input#nik')

    // await that.page.waitForSelector('input#nik')

  }

  let [hapus] = await that.page.$x("//button[contains(., 'Hapus')]");
  if(hapus){
    await hapus.click();
  }

  // await that.page.type('input#nik', '3372026504730002')
  await that.page.type('input#nik', nik)

  await Promise.all([
    that.clickBtn({ text: 'Filter'}),
    that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
  ])

  // console.log(JSON.stringify(that.response[that.response.length-1].json))
  let [table] = await that.page.$x("//table[contains(., 'Nama')]")
  while(!table){
    ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
  }
  let exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, nik)
  that.spinner.succeed(`cariConfirmByNIK nik: ${nik}, exists: ${exists}`)
  return exists
}

exports._cariKonterByNIK = async ({ that, nik }) => {
  that.spinner.start(`cariKonterByNIK`)

  await that.page.reload()

  await that.findXPathAndClick({ xpath: `//span[contains(.,'2. Kontak Erat')]`})

  // // await that.page.waitForTimeout(5000)

  await that.page.waitForSelector('#nik')
  // // await that.page.type('input#nik', '3372026504730002')
  await that.page.type('#nik', nik)

  // // console.log('mau klik')

  await that.clickBtn({ text: 'Filter'})

  // // console.log('filter')

  await that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
  let [table] = await that.page.$x("//table[contains(., 'Nama')]")
  while(!table){
    [table] = await that.page.$x("//table[contains(., 'Nama')]")
  }
  let exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, nik)
  // console.log(confirmData.nik, exists)
  that.spinner.succeed(`cariKonterByNIK ${nik} exists: ${exists}`)

  return exists

}

exports._catatKonfirmasiBaru = async ({ that, confirmData}) => {
  that.spinner.start(`catatKonfirmasiBaru`)
  await that.clickBtn({ text: 'Catat Kasus' })

  await that.page.waitForSelector('#root > section > section > main > div > div > div.ant-space.ant-space-horizontal.ant-space-align-baseline > div:nth-child(1) > button')
  that.spinner.start(`input: confirmData.nik: ${confirmData.nik}, confirmData.nama: ${confirmData.nama}`)

  await that.inputTgl({
    element: 'casenrollment_date',
    tgl: confirmData.tgl_onset
  })
  // await that.page.waitForTimeout(5000)

  await that.clickSelanjutnya()

  // await that.page.waitForSelector('#CovidCaseProfileForm_mHwPpgxFDge')

  await that.page.type('#CovidCaseProfileForm_mHwPpgxFDge', confirmData.nik)

  for (let periksa of await that.page.$x(`//button[contains(.,'Periksa')]`)){
    if (await that.isVisible({ el: periksa})){
      await Promise.all([
        periksa.click(),
        that.page.waitForResponse(response=> response.url().includes(confirmData.nik) && response.status() === 200)
      ])

    }
  }

  that.spinner.succeed(that.response)

  if(that.response.includes(confirmData.nik) && that.response.toLowerCase().includes('belum')){
    let nama = await that.getInnerText({ el: '#CovidCaseProfileForm_GdwLfGObIRT'})
    if(!nama.length){
      await that.page.type('#CovidCaseProfileForm_GdwLfGObIRT', confirmData.nama)
      await that.page.type('#CovidCaseProfileForm_fk5drl1hTvc', confirmData.umur)
      await that.page.type('#CovidCaseProfileForm_quJD4An7Kmi', confirmData.alamat_sesuai_identitas)
      await that.page.type('#CovidCaseProfileForm_e25qAod3KTg', confirmData.alamat_domisili)
      let jkbtn = await that.page.$x(`//label[contains(., '${confirmData.jk}')]`)
      jkbtn[0] && await jkbtn[0].click()
    }
    await that.page.type('#CovidCaseProfileForm_YlOp8W4FYRH', confirmData.no_hp)
    await that.clickSelanjutnya()
    await that.page.waitForSelector('#ContactFactorForm_eventDate')
    await that.inputTgl({
      element: 'ContactFactorForm_eventDate',
      tgl: confirmData.tgl_onset
    })
    await Promise.all([
      that.clickBtn({ text: 'Simpan'}),
      that.page.waitForResponse(response=> response.status() === 200)
    ])
    // await that.page.waitForTimeout(5000)
  } else {
    let existsAsKonter = await that.cariKonterByNIK({ nik: confirmData.nik})
  }

  // let nikFindResponses = await that.response.filter( resp => resp.url.includes(confirmData.nik))

  // console.log(nikFindResponses[nikFindResponses.length-1].response)


  // await that.page.waitForTimeout(5000)
  that.spinner.succeed(`catatKonfirmasiBaru ${confirmData.nik}`)


}