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



exports._cariConfirmByNIK = async ({ that, nik }) => {
  that.spinner.start(`cariConfirmByNIK ${nik}`)

  let inputNIK = await that.page.$('input#nik')

  while(!inputNIK){
    await that.page.reload()
    // await that.page.waitForTimeout(500)
    inputNIK = await that.page.$('input#nik')

    // await that.page.waitForSelector('input#nik')

  }

  let [hapus] = await that.page.$x("//button[contains(., 'Hapus')]");
  if(hapus){
    await hapus.click();
  }

  that.spinner.start(`cariConfirmByNIK nik: ${nik}`)
  // await that.page.type('input#nik', '3372026504730002')
  await that.page.type('input#nik', nik)

  await Promise.all([
    that.clickBtn({ text: 'Filter'}),
    that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
  ])

  // console.log(JSON.stringify(that.response[that.response.length-1].json))
  let [table] = await that.page.$x("//table[contains(., 'Nama')]")
  while(!table){
    await that.page.waitForTimeout(500)
    ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
  }
  await that.page.waitForTimeout(500)
  let exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, nik)
  // that.spinner.succeed(`cariConfirmByNIK nik: ${nik}, exists: ${exists}`)
  return exists
}

exports._cariKonterByNIK = async ({ that, nik }) => {
  that.spinner.start(`cariKonterByNIK ${nik}`)

  await that.page.waitForTimeout(1000)

  await that.page.reload()

  await that.findXPathAndClick({ xpath: `//span[contains(.,'2. Kontak Erat')]`})

  // // await that.page.waitForTimeout(5000)

  await that.waitFor({selector: '#nik'})
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

  // that.spinner.succeed(`cariKonterByNIK ${nik} exists: ${exists}`)

  return exists

}

exports._catatKonfirmasiBaru = async ({ that, confirmData}) => {
  that.spinner.start(`catatKonfirmasiBaru`)
  await that.clickBtn({ text: 'Catat Kasus' })

  await that.waitFor({ selector : '#root > section > section > main > div > div > div.ant-space.ant-space-horizontal.ant-space-align-baseline > div:nth-child(1) > button'})
  that.spinner.start(`input: confirmData.nik: ${confirmData.nik}, confirmData.nama: ${confirmData.nama}`)

  await that.inputTgl({
    element: 'casenrollment_date',
    tgl: confirmData.konfirm_tgl_onset
  })
  // await that.page.waitForTimeout(5000)

  await that.clickSelanjutnya()

  // await that.page.waitForSelector('#CovidCaseProfileForm_mHwPpgxFDge')

  await that.page.type('#CovidCaseProfileForm_mHwPpgxFDge', confirmData.nik)

  let notif

  for (let periksa of await that.page.$x(`//button[contains(.,'Periksa')]`)){
    if (await that.isVisible({ el: periksa})){
      await periksa.click()
      await that.page.waitForResponse(response=> response.url().includes(confirmData.nik) && response.status() === 200)
      for ( let el of [...await that.page.$$(`div.ant-notification`)]) {
        notif = await that.page.evaluate( el => el.innerText, el)
      }

    }
  }

  notif && that.spinner.succeed(notif.split('\n').map(e => e.trim()).join(' '))

  if(notif && notif.toLowerCase().includes('belum terdaftar')){
    await that.page.waitForTimeout(2000)
    let nama = await that.page.evaluate(() => document.getElementById('CovidCaseProfileForm_GdwLfGObIRT').getAttribute('value'))
    // getInnerText({ el: '#CovidCaseProfileForm_GdwLfGObIRT'})
    if(!nama.length){
      await that.page.type('#CovidCaseProfileForm_GdwLfGObIRT', confirmData.nama)
      await that.page.type('#CovidCaseProfileForm_fk5drl1hTvc', confirmData.umur)
      await that.page.type('#CovidCaseProfileForm_quJD4An7Kmi', confirmData.alamat_sesuai_identitas)
      let jkbtn = await that.page.$x(`//label[contains(., '${confirmData.jk}')]`)
      jkbtn[0] && await jkbtn[0].click()
    } else {
      that.spinner.start(`nama ${nama} sudah ditarik dari NIK`)
    }
    await that.page.type('#CovidCaseProfileForm_e25qAod3KTg', confirmData.alamat_domisili)
    await that.page.type('#CovidCaseProfileForm_YlOp8W4FYRH', confirmData.konfirm_no_hp)


    await that.clickSelanjutnya()

    // await that.page.waitForSelector('#ContactFactorForm_eventDate')
    let ada = await that.page.$('#ContactFactorForm_eventDate')
    while(!ada){
      await that.clickSelanjutnya()
      await that.page.waitForTimeout(100)
      ada = await that.page.$('#ContactFactorForm_eventDate')
    }
    await that.inputTgl({
      element: 'ContactFactorForm_eventDate',
      tgl: confirmData.konfirm_tgl_wawancara
    })
      
    await that.clickBtn({ text: 'Simpan'})

    await that.page.waitForTimeout('5000')
      
    await that.page.waitForResponse(response=> response.status() === 200)

    await that.upsertPerson({ person: Object.assign({}, confirmData, {
      konfirm_silacak: true
    })})
    // await that.page.waitForTimeout(5000)
  } else {
    // let existsAsKonter = await that.cariKonterByNIK({ nik: confirmData.nik})
  }

  // let nikFindResponses = await that.response.filter( resp => resp.url.includes(confirmData.nik))

  // console.log(nikFindResponses[nikFindResponses.length-1].response)


  // await that.page.waitForTimeout(5000)
  that.spinner.succeed(`catatKonfirmasiBaru ${confirmData.nik}`)


}