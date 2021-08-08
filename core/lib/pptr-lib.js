const pptr = require('puppeteer-core')
const waitOpt = {
  waitUntil: 'networkidle0',
  // timeout: 0
}

exports.waitOpt = waitOpt      
exports._waitNav = async ({ that }) => await that.page.waitForNavigation(waitOpt)

exports._inputTgl = async ({ that, element, tgl }) => {
  let blnThn = that.changeToSlcBlnThn(tgl)

  await that.page.focus(`#${element}`);
  await that.page.click(`#${element}`);
  await that.page.waitForTimeout(500)

  let pickerElements = await that.page.$$('div.ant-picker-dropdown')
  console.log(pickerElements.length)

  let blnThnDef = await that.page.$$eval('div.ant-picker-header-view', els => [...els][[...els].length-1].innerText)
  
  let diff = that.getTglDiff(blnThnDef, blnThn)
  console.log(element, blnThn, '|', blnThnDef, diff)

  let slash = that.slashToStrip(tgl)

  let [td] = await that.page.$x(`//td[contains(@title, '${slash}')]`)
  while(!td){
    while (diff < 0 && blnThn !== blnThnDef){
      await that.page.waitForSelector('div.ant-picker-date-panel > div.ant-picker-header > button.ant-picker-header-prev-btn > span', {
        visible: true
      })
      await that.page.focus('div.ant-picker-date-panel > div.ant-picker-header > button.ant-picker-header-prev-btn > span')
      await that.page.click('div.ant-picker-date-panel > div.ant-picker-header > button.ant-picker-header-prev-btn > span')
  
      await that.page.waitForTimeout(500)
  
      blnThnDef = await that.page.$$eval('div.ant-picker-header-view', els => [...els][[...els].length-1].innerText)

      console.log(element, blnThn, '|', blnThnDef, diff)

      diff = that.getTglDiff(blnThnDef, blnThn)
      console.log(element, blnThn, '|', blnThnDef, diff)
    }

    // await that.page.waitForTimeout(500)
  }

  [td] = await that.page.$x(`//td[contains(@title, '${slash}')]`)
  await td.focus()
  // await that.page.waitForTimeout(500)
  await td.click()

  // await that.page.waitForTimeout(10000)

  // await that.page.$eval(`#${element}`,(e) => e.removeAttribute("readonly"))

  // await that.page.evaluate( (element, tgl) => {
  //   document.getElementById(element).value = tgl
  // }, element, tgl)

}

exports._pilihOpsi = async ({ that, element, pilihan }) => {
  await that.page.focus(`#${element}`);
  await that.page.click(`#${element}`);
  await that.page.waitForTimeout(500)

  let num = Number(pilihan) - 1

  while(num){
    await that.page.keyboard.press('ArrowDown')
    await that.page.waitForTimeout(500)
    num--
  }

}

exports._clickSelanjutnya = async({ that }) => await that.clickBtn({ text: 'Selanjutnya' })

exports._clickBtn = async({ that, text}) => {
  let [btn] = await that.page.$x(`//button[contains(., '${text}')]`);
  while(!btn){
    [btn] = await that.page.$x(`//button[contains(., '${text}')]`);
  }
  await btn.focus();
  await btn.click();

}

exports._pushConfirm = async ({ that, confirmData }) => {
  if(!confirmData.silacak) {
    // push ke silacak
    await that.loginSilacak()

    let exists = await that.cariConfirmByNIK({ nik: confirmData.nik})

    if(!exists){
      await that.clickBtn({ text: 'Catat Kasus' })

      await that.page.waitForSelector('#root > section > section > main > div > div > div.ant-space.ant-space-horizontal.ant-space-align-baseline > div:nth-child(1) > button')
      // console.log('input', confirmData.nik, confirmData.nama)

      await that.inputTgl({
        element: 'casenrollment_date',
        tgl: confirmData.tgl_onset
      })
      // await that.page.waitForTimeout(5000)

      await that.clickSelanjutnya()

      await that.page.waitForSelector('#CovidCaseProfileForm_mHwPpgxFDge')

      await that.page.type('#CovidCaseProfileForm_mHwPpgxFDge', confirmData.nik)
      await that.page.type('#CovidCaseProfileForm_GdwLfGObIRT', confirmData.nama)

      await that.page.type('#CovidCaseProfileForm_fk5drl1hTvc', confirmData.umur)
      await that.page.type('#CovidCaseProfileForm_quJD4An7Kmi', confirmData.alamat_sesuai_identitas)
      await that.page.type('#CovidCaseProfileForm_e25qAod3KTg', confirmData.alamat_domisili)
      await that.page.type('#CovidCaseProfileForm_YlOp8W4FYRH', confirmData.no_hp)


      let jkbtn = await that.page.$x(`//label[contains(., '${confirmData.jk}')]`)
      jkbtn[0] && await jkbtn[0].click()

      await that.clickSelanjutnya()

      await that.page.waitForSelector('#ContactFactorForm_eventDate')

      await that.inputTgl({
        element: 'ContactFactorForm_eventDate',
        tgl: confirmData.tgl_onset
      })

      await that.clickBtn({ text: 'Simpan'})

      await that.page.waitForResponse(response=> response.status() === 200)
      // await that.page.waitForTimeout(5000)

    } 
  }
  // that.spinner.succeed(`sudah ada ${confirmData.nik} ${confirmData.nama}`)


}

exports._gotoKonterTab = async({ that }) => {
  let [kontakErat] = await that.page.$x("//div[contains(@class, 'ant-tabs-tab') and contains(.,'Kontak')]")
  while(!kontakErat){
    [kontakErat] = await that.page.$x("//div[contains(@class, 'ant-tabs-tab') and contains(.,'Kontak')]")
  }

  await kontakErat.click()

}

exports._pushKonter = async ({ that, konterData, confirmData }) => {
  if(!konterData.silacak) {
    await that.loginSilacak()

    if(!confirmData.href){
      let [row] = await that.page.$x(`//tr[contains(.,'${confirmData.nik}')]`)
      let hrefEl = await row.$('td > a')
      let href = await that.page.evaluate( el => el.getAttribute('href').split('/')[el.getAttribute('href').split('/').length-1], hrefEl)
  
      await hrefEl.click()
  
      // console.log(href)
  
      await that.page.waitForResponse(response=> response.url().includes(href) && response.status() === 200)
  
      confirmData.href = href
  
    }

    await that.gotoKonterTab()

    // let exists = await that.cariKonterByNIK({ nik: konterData.nik})

    // console.log(exists, konter)

    await that.clickBtn({ text: 'Tambah'})

    await that.page.waitForSelector('#casenrollment_date')

    await that.inputTgl({
      element: 'casenrollment_date',
      tgl: konterData.tanggal_wawancara || konterData.tanggal_lapor || konterData.tanggal_kontak_dengan_indeks_kasus
    })

    // await that.page.waitForTimeout(5000)

    await that.clickSelanjutnya()

    //---------------------------------------------------------------------------------

    await that.page.waitForSelector('#CovidCaseProfileForm_mHwPpgxFDge')

    await that.page.type('#CovidCaseProfileForm_mHwPpgxFDge', konterData.nik)
    await that.page.type('#CovidCaseProfileForm_GdwLfGObIRT', konterData.nama)

    await that.page.type('#CovidCaseProfileForm_fk5drl1hTvc', konterData.usia)
    await that.page.type('#CovidCaseProfileForm_quJD4An7Kmi', konterData.alamat_domisili)
    await that.page.type('#CovidCaseProfileForm_e25qAod3KTg', konterData.alamat_domisili)
    await that.page.type('#CovidCaseProfileForm_YlOp8W4FYRH', konterData.no_hp)


    let jkbtn = await that.page.$x(`//label[contains(., '${konterData.jk}')]`)
    jkbtn[0] && await jkbtn[0].click()

    await that.clickSelanjutnya()

    //----------------------------------------------------------------------------------

    await that.page.waitForSelector('#ContactFactorForm_eventDate')

    await that.inputTgl({
      element: 'ContactFactorForm_eventDate',
      tgl: konterData.tanggal_wawancara || konterData.tanggal_lapor || konterData.tanggal_kontak_dengan_indeks_kasus
    })

    await that.inputTgl({
      element: 'ContactFactorForm_CcijMqQR3tM',
      tgl: konterData.tanggal_wawancara || konterData.tanggal_lapor || konterData.tanggal_kontak_dengan_indeks_kasus
    })

    // await that.pilihOpsi({
    //   element: 'ContactFactorForm_iZ4G8QnSTqB',
    //   pilihan: konterData.hubungan_dengan_indeks_kasus
    // })

    
    // await that.pilihOpsi({
    //   element: 'ContactFactorForm_Y6Iseq8vUlU',
    //   pilihan: konterData.kategori_kontak_erat
    // })

    // await that.inputTgl({
    //   element: 'ContactFactorForm_eventEntryReqDate',
    //   tgl: that.tambah1(konterData.tanggal_wawancara || konterData.tanggal_lapor || konterData.tanggal_kontak_dengan_indeks_kasus)
    // })

    // await that.inputTgl({
    //   element: 'ContactFactorForm_eventExitReqDate',
    //   tgl: that.tambah6(konterData.tanggal_wawancara || konterData.tanggal_lapor || konterData.tanggal_kontak_dengan_indeks_kasus)
    // })

    // await that.clickBtn({ text: 'Simpan'})

    await that.page.waitForResponse(response=> response.status() === 200)

    await that.page.waitForTimeout(5000)

    return confirmData

  }
}

exports._loginSilacak = async ({ that }) => {
  await that.initBrowser()

  let needLogin = await that.page.$('input#username')

  if(needLogin) {
    that.spinner.start('login silacak')
    await that.page.type('input#username', that.config.SILACAK_USER)
    await that.page.type('input#password', that.config.SILACAK_PASSWORD, { delay: 100 })
    await that.page.click('button.btn.btn-login[name="loginbtn"][type="submit"]', {delay: 500})
    await that.page.waitForNavigation(waitOpt)
    that.spinner.succeed('logged in')
  
  }

}

exports._initBrowser = async ({ that }) => {
  if(!that.Browser) {
    that.Browser = await pptr.launch({
      headless: false,
      executablePath: `${that.config.CHROME_PATH}`,
      userDataDir: `${that.config.USER_DATA_PATH}`,
    })
    that.pages = await that.Browser.pages()
    that.page = that.pages[0]
    that.page.on('response', async response => {
      if(response.status() === 200 && response.request().resourceType()=== 'xhr' && response.url().includes('.json')){
        let json = await response.json()
        that.response.push({
          url: response.url(),
          json
        })
  //     console.log(JSON.stringify(json))
      }
    })
    await that.page.goto(`${that.config.SILACAK_URL}`, waitOpt)
    
  }




}