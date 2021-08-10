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
    await that.page.waitForTimeout(500);

    let isKonterInput = await that.page.$('#casenrollment_date')

    while(!isKonterInput){
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


      //--------------------------------------------------------------

      // warning: cari konter dulu di listnya konter dari konfirm






      //==============================================================

      // let exists = await that.cariKonterByNIK({ nik: konterData.nik})
  
      // console.log(exists, konter)
  
      await that.clickBtn({ text: 'Tambah'})
  
      await that.page.waitForSelector('#casenrollment_date')
  
      isKonterInput = await that.page.$('#casenrollment_date')
  
    }

    that.spinner.start('siap input')

    // console.log(konterData)

    await that.inputTgl({
      element: 'casenrollment_date',
      tgl: konterData.konter_tgl_wawancara
    })

    // await that.page.waitForTimeout(5000)

    await that.clickSelanjutnya()

    //---------------------------------------------------------------------------------

    await that.page.waitForSelector('#CovidCaseProfileForm_mHwPpgxFDge')

    await that.page.type('#CovidCaseProfileForm_mHwPpgxFDge', konterData.nik)
    await that.page.type('#CovidCaseProfileForm_GdwLfGObIRT', konterData.nama)

    await that.page.type('#CovidCaseProfileForm_fk5drl1hTvc', konterData.umur)
    await that.page.type('#CovidCaseProfileForm_quJD4An7Kmi', konterData.alamat_domisili || konterData.alamat)
    await that.page.type('#CovidCaseProfileForm_e25qAod3KTg', konterData.alamat_domisili || konterData.alamat)
    await that.page.type('#CovidCaseProfileForm_YlOp8W4FYRH', konterData.konter_no_hp)


    let jkbtn = await that.page.$x(`//label[contains(., '${konterData.jk}')]`)
    jkbtn[0] && await jkbtn[0].click()

    await that.clickSelanjutnya()

    //----------------------------------------------------------------------------------

    await that.page.waitForSelector('#ContactFactorForm_eventDate')

    await that.inputTgl({
      element: 'ContactFactorForm_eventDate',
      tgl: konterData.konter_tgl_wawancara
    })

    // await that.page.click('#root > section > section > main > div')

    await that.inputTgl({
      element: 'ContactFactorForm_CcijMqQR3tM',
      tgl: konterData.konter_tgl_kontak
    })

    // await that.page.click('#root > section > section > main > div')

    await that.inputTgl({
      element: 'ContactFactorForm_eventEntryReqDate',
      tgl: konterData.konter_tgl_entry_test
    })

    // await that.page.click('#root > section > section > main > div')

    await that.inputTgl({
      element: 'ContactFactorForm_eventExitReqDate',
      tgl: konterData.konter_tgl_exit_test
    })

    await that.pilihOpsi({
      element: 'ContactFactorForm_iZ4G8QnSTqB',
      pilihan: konterData.konter_hubungan_dengan_indeks_kasus
    })

    
    await that.pilihOpsi({
      element: 'ContactFactorForm_Y6Iseq8vUlU',
      pilihan: konterData.konter_kategori_kontak_erat
    })

    await that.clickBtn({ text: 'Simpan'})

    await that.page.waitForResponse(response=> response.status() === 200)

    await that.upsertPerson({ person: Object.assign({}, konterData, {
      konter_silacak: true
    })})

    // await that.page.waitForTimeout(500)

    // return confirmData

  }
}

