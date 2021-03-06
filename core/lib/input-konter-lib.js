exports._inputKonter = async ({ that, konterData }) => {
  await that.clickBtn({ text: 'Tambah'})
  
  await that.waitFor({selector:'#casenrollment_date'})

  // isKonterInput = await that.page.$('#casenrollment_date')

  that.spinner.start('siap input')

  // console.log(konterData)

  await that.inputTgl({
    element: 'casenrollment_date',
    tgl: konterData.konter_tgl_wawancara
  })

  // await that.page.waitForTimeout(5000)

  await that.clickSelanjutnya()

  //---------------------------------------------------------------------------------

  await that.waitFor({selector:'#CovidCaseProfileForm_mHwPpgxFDge'})

  await that.page.type('#CovidCaseProfileForm_mHwPpgxFDge', konterData.nik)

  let notif

  await that.findXPathAndClick({ xpath: `//button[contains(.,'Periksa')]`})

  while(!notif){
    await that.page.waitForTimeout(100)
    for ( let el of [...await that.page.$$(`div.ant-notification`)]) {
      notif = await that.page.evaluate( el => el.innerText, el)
    }
  }
  await that.page.waitForTimeout(500)

  // for (let periksa of await that.page.$x(`//button[contains(.,'Periksa')]`)){
  //   if (await that.isVisible({ el: periksa})){
  //     await periksa.click()
      // await that.page.waitForResponse(response=> response.url().includes(konterData.nik) && response.status() === 200)
      // for ( let el of [...await that.page.$$(`div.ant-notification`)]) {
      //   notif = await that.page.evaluate( el => el.innerText, el)
      // }

    // }
  // }

  notif && that.spinner.succeed(notif.split('\n').map(e => e.trim()).join(' '))

  if(notif && notif.toLowerCase().includes('belum terdaftar')){
    await Promise.all([
      that.page.waitForTimeout(2000),
      // that.page.waitForResponse(response=> response.status() === 200)
    ])
    let nama = await that.page.evaluate(() => document.getElementById('CovidCaseProfileForm_GdwLfGObIRT').getAttribute('value'))
    // getInnerText({ el: '#CovidCaseProfileForm_GdwLfGObIRT'})
    if(!nama.length){
      await that.page.type('#CovidCaseProfileForm_GdwLfGObIRT', konterData.nama)
      await that.page.type('#CovidCaseProfileForm_fk5drl1hTvc', konterData.umur)
      await that.page.type('#CovidCaseProfileForm_quJD4An7Kmi', konterData.alamat_domisili || konterData.alamat)
      let jkbtn = await that.page.$x(`//label[contains(., '${konterData.jk}')]`)
      jkbtn[0] && await jkbtn[0].click()

    } else {
      that.spinner.start(`nama ${nama} sudah ditarik dari NIK`)
    }

    await that.page.type('#CovidCaseProfileForm_e25qAod3KTg', konterData.alamat_domisili || konterData.alamat)
    await that.page.type('#CovidCaseProfileForm_YlOp8W4FYRH', konterData.konter_no_hp)
  
    await that.clickSelanjutnya()
  
    //----------------------------------------------------------------------------------
  
    await that.waitFor({selector: '#ContactFactorForm_eventDate'})
  
    // await that.inputTgl({
    //   element: 'ContactFactorForm_eventDate',
    //   tgl: konterData.konter_tgl_wawancara
    // })
  
    // await that.page.click('#root > section > section > main > div')
  
    await that.inputTgl({
      element: 'ContactFactorForm_CcijMqQR3tM',
      tgl: konterData.konter_tgl_kontak
    })
  
    await that.pilihOpsi({
      element: 'ContactFactorForm_iZ4G8QnSTqB',
      pilihan: konterData.konter_hubungan_dengan_indeks_kasus
    })
  
    
    await that.pilihOpsi({
      element: 'ContactFactorForm_Y6Iseq8vUlU',
      pilihan: konterData.konter_kategori_kontak_erat
    })
  
    // await that.page.click('#root > section > section > main > div')
  
    await that.inputTgl({
      element: 'ContactFactorForm_eventEntryReqDate',
      tgl: konterData.konter_tgl_entry
    })
  
    // await that.page.click('#root > section > section > main > div')
  
    await that.inputTgl({
      element: 'ContactFactorForm_eventExitReqDate',
      tgl: konterData.konter_tgl_exit
    })
  
    await that.clickBtn({ text: 'Simpan'})
  
    await that.page.waitForTimeout(2000)
    // person.konter_silacak
  
    // await that.page.waitForResponse(response=> response.status() === 200)
  
  }

  await that.reload()

  konterData.konter_silacak = true

  konterData = await that.upsertPerson({ person: konterData })


}