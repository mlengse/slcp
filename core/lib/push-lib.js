exports._pushConfirm = async ({ that, confirmData }) => {
  that.spinner.start(`pushConfirm ${confirmData.nama} ${confirmData.nik}`)
  if(!confirmData.konfirm_silacak) {
    // push ke silacak
    await that.loginSilacak()

    // let exists = await that.cariConfirmByNIK({ confirmData})

    // exists && await that.upsertPerson({person: Object.assign({}, confirmData, {
    //   konfirm_silacak: true
    // })})

    // if(!exists){

      // await that.cariKonterByNIK({ nik: confirmData.nik})
      
      await that.catatKonfirmasiBaru({confirmData})
      // await that.reload()

    // } 
  }
  // that.spinner.succeed(`sudah ada ${confirmData.nik} ${confirmData.nama}`)


}

exports._pushKonter = async ({ that, konterData, confirmData }) => {
  // if(!konterData.konter_silacak) {
  that.spinner.start(`pushKonter ${konterData.nik} ${konterData.nama}`)
  // await that.page.waitForTimeout(500);

  // while(!isKonterInput){
  await that.loginSilacak()

  // await that.page.reload()

  let indeksExists = await that.cariConfirmByNIK({confirmData})

  if(indeksExists) {
    let [row] = await that.page.$x(`//tr[contains(.,'${confirmData.nik}')]`)
    while(!row){
      await that.page.waitForTimeout(500);
      [row] = await that.page.$x(`//tr[contains(.,'${confirmData.nik}')]`)
    }
    let hrefEl = await row.$('td > a')
    let href = await that.page.evaluate( el => el.getAttribute('href').split('/')[el.getAttribute('href').split('/').length-1], hrefEl)

    await row.$eval('td > a', a => a.click())

    // console.log(href)

    await that.page.waitForResponse(response=> response.url().includes('.json') && response.url().includes(href) && response.status() === 200)

    if(!confirmData.href){
      confirmData.href = href
    }  

    await that.page.waitForTimeout(2000);

    await that.gotoKonterTab()
    await that.page.waitForTimeout(2000);

    let btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
      && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)

    while(!btnTambahKonter){
      btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
        && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)
    }

    let exists = false
    
    // await that.page.waitForResponse(response=> response.url().includes(`Gf4Ojyk54rO`) && response.status() === 200)

    let noKonter = await that.page.$$eval('div.ant-empty', els => els && els.length && [...els].filter( e => e.innerText 
      && e.innerText.toLowerCase().includes('tidak ada kontak erat')).length)
    if(!noKonter){
      //--------------------------------------------------------------

      // warning: cari konter dulu di listnya konter dari konfirm

      // console.log(JSON.stringify(that.response[that.response.length-1].json))
      let [table] = await that.page.$x("//table[contains(., 'Nama')]")
      while(!table){
        ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
      }
      // console.log(konterData.nik)
      exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, konterData.nik)

      if(exists) {
        konterData.konter_silacak = true
        konterData = await that.upsertPerson({ person: konterData })
        that.spinner.succeed(`cari konter by NIK in confirm tab | nik: ${konterData.nik}, exists: ${exists}, konter_silacak: ${konterData.konter_silacak}`)
      }

  
      //==============================================================

    } 

    if(!exists){
      await that.inputKonter({ konterData })
    }

  }
  
}

