exports._catatKonfirmasiBaru = async ({ that, confirmData}) => {
  that.spinner.start(`catatKonfirmasiBaru ${confirmData.nik}`)
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

  await that.findXPathAndClick({ xpath: `//button[contains(.,'Periksa')]`})

  while(!notif){
    await that.page.waitForTimeout(100)
    for ( let el of [...await that.page.$$(`div.ant-notification`)]) {
      notif = await that.page.evaluate( el => el.innerText, el)
    }
  }

  notif && that.spinner.succeed(notif.split('\n').map(e => e.trim()).join(' '))

  if(notif && notif.toLowerCase().includes('belum terdaftar')){
    await Promise.all([
      that.page.waitForTimeout(2000),
      // that.page.waitForResponse(response=> response.status() === 200)
    ])
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

  confirmData.konfirm_silacak = true

  await that.upsertPerson({ person: confirmData})


  // await that.page.waitForTimeout(5000)
  that.spinner.succeed(`catatKonfirmasiBaru ${confirmData.nik}`)


}