exports._pushConfirm = async ({ that, confirmData }) => {
  that.spinner.start(`pushConfirm`)
  if(!confirmData.konfirm_silacak) {
    // push ke silacak
    await that.loginSilacak()

    let exists = await that.cariConfirmByNIK({ nik: confirmData.nik})

    exists && await that.upsertPerson({person: Object.assign({}, confirmData, {
      konfirm_silacak: true
    })})

    if(!exists){

      // await that.cariKonterByNIK({ nik: confirmData.nik})
      
      await that.catatKonfirmasiBaru({confirmData})
      await that.page.reload()

    } 
  }
  // that.spinner.succeed(`sudah ada ${confirmData.nik} ${confirmData.nama}`)


}

exports._pushKonter = async ({ that, konterData, confirmData }) => {
  if(!konterData.konter_silacak) {
    that.spinner.start(`pushKonter ${konterData.nik}`)
    // await that.page.waitForTimeout(500);


    // while(!isKonterInput){
      await that.loginSilacak()

      await that.page.reload()

      await that.cariConfirmByNIK({nik: confirmData.nik})

      let [row] = await that.page.$x(`//tr[contains(.,'${confirmData.nik}')]`)
      while(!row){
        await that.page.waitForTimeout(500);
        [row] = await that.page.$x(`//tr[contains(.,'${confirmData.nik}')]`)
      }
      let hrefEl = await row.$('td > a')
      let href = await that.page.evaluate( el => el.getAttribute('href').split('/')[el.getAttribute('href').split('/').length-1], hrefEl)
  
      await hrefEl.click()
  
      // console.log(href)
  
      await that.page.waitForResponse(response=> response.url().includes(href) && response.status() === 200)
  
      if(!confirmData.href){
        confirmData.href = href
      }  

      await that.gotoKonterTab()

      let btnTambahKonter = await that.page.evaluate(() => [...document.querySelectorAll('button.ant-btn-primary')].filter( e => e.innerText.toLowerCase().includes(`tambah kontak erat baru`)))

      while(!btnTambahKonter.length){
        btnTambahKonter = await that.page.evaluate(() => [...document.querySelectorAll('button.ant-btn-primary')].filter( e => e.innerText.toLowerCase().includes(`tambah kontak erat baru`)))
      }

      let exists = false

      let noKonter = await that.page.evaluate(() => [...document.querySelectorAll('div.ant-empty')].filter(e => e.innerText.toLowerCase().includes('tidak ada kontak erat')))

      if(!noKonter.length){
        //--------------------------------------------------------------

        // warning: cari konter dulu di listnya konter dari konfirm


        await that.page.waitForResponse(response=> response.url().includes(`Gf4Ojyk54rO`) && response.status() === 200)

        // console.log(JSON.stringify(that.response[that.response.length-1].json))
        let [table] = await that.page.$x("//table[contains(., 'Nama')]")
        while(!table){
          ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
        }
        exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, konterData.nik)
        that.spinner.succeed(`cari konter by NIK in confirm tab | nik: ${nik}, exists: ${exists}`)


        //==============================================================

      } 

      if(!exists){
        await that.inputKonter({ konterData })
      }

      await that.upsertPerson({ person: Object.assign({}, konterData, {
        konter_silacak: true
      })})
    
  // }


    // await that.page.waitForTimeout(500)

    // return confirmData

  }
}

