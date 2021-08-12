exports._inputKonter = async ({ that, konterData }) => {
  await that.clickBtn({ text: 'Tambah'})
  
  await that.page.waitForSelector('#casenrollment_date')

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

}