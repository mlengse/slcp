const pptr = require('puppeteer-core')
const waitOpt = {
  waitUntil: 'networkidle0',
  // timeout: 0
}

exports.waitOpt = waitOpt      
exports._waitNav = async ({ that }) => await that.page.waitForNavigation(waitOpt)

exports._getInnerText = async({ that, el}) => await that.page.evaluate( el => el.innerText, el)

exports._findXPathAndClick = async ({ that, xpath }) => {
  that.spinner.start(`findXPathAndClick ${xpath}`)
  for(let el of await that.page.$x(xpath)){
    if(await that.isVisible({ el })){
      await el.focus()
      await el.click()
    }
  }

}

exports._isVisible = async ({ that, el }) => {
  return await that.page.evaluate( elem => {
    if (!(elem instanceof Element)) throw Error('DomUtil: elem is not an element.');
    const style = getComputedStyle(elem);
    if (style.display === 'none') return false;
    if (style.visibility !== 'visible') return false;
    if (style.opacity < 0.1) return false;
    if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height +
        elem.getBoundingClientRect().width === 0) {
        return false;
    }
    const elemCenter   = {
        x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
        y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
    };
    if (elemCenter.x < 0) return false;
    if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) return false;
    if (elemCenter.y < 0) return false;
    if (elemCenter.y > (document.documentElement.clientHeight || window.innerHeight)) return false;
    let pointContainer = document.elementFromPoint(elemCenter.x, elemCenter.y);
    do {
        if (pointContainer === elem) return true;
    } while (pointContainer = pointContainer.parentNode);
    return false;
  }, el)
}

exports._getPicker =  async ({ that }) => {
  that.spinner.start(`getPicker`)
  let pickerElements = await that.page.$$('div.ant-picker-dropdown')
  let pickerElement
  while(!pickerElement){
    for(let pick of [...pickerElements]){
      let cl = await that.isVisible({ el: pick})
      if(cl){
        pickerElement = pick
      }
    }
  
  }

  return pickerElement

}

exports._inputTgl = async ({ that, element, tgl }) => {
  that.spinner.start(`element: ${element}, tgl: ${tgl}`)
  let blnThn = that.changeToSlcBlnThn(tgl)
  await that.page.click(`#${element}`);
  // await that.page.waitForTimeout(500)
  let slash = that.slashToStrip(tgl)
  let pickerElement = await that.getPicker()
  let blnThnDef = await pickerElement.$eval('div.ant-picker-header-view', el => el.innerText)
  let diff = that.getTglDiff(blnThnDef, blnThn)
  let left = await pickerElement.$('button.ant-picker-header-prev-btn > span')
  while (diff < 0 && blnThn !== blnThnDef){
    pickerElement = await that.getPicker()
    blnThnDef = await pickerElement.$eval('div.ant-picker-header-view', el => el.innerText)
    diff = that.getTglDiff(blnThnDef, blnThn)
    left = await pickerElement.$('button.ant-picker-header-prev-btn > span')
    await left.click()
    await that.page.waitForTimeout(500)
    blnThnDef = await pickerElement.$eval('div.ant-picker-header-view', el => el.innerText)
    diff = that.getTglDiff(blnThnDef, blnThn)
    that.spinner.start(`element: ${element}, tgl: ${tgl}, blnThn: ${blnThn}, blnThnDef: ${blnThnDef}, diff: ${diff}, slash: ${slash}`)
  }
  // await that.page.waitForTimeout(500)
  let td, tgll
  let num = 0
  while(!td){
    let tds = await that.page.$x(`//td[contains(@title, '${slash}')]`)
    for(let tt of tds){
      let tdVis = await that.isVisible({ el: tt })
      if(tdVis){
        td = tt
        tgll = await td.evaluate( el => el.innerText)
      }
      that.spinner.start(`tdVis: ${tdVis}, tgll: ${tgll}, slash: ${slash}`)
    }
    // await that.page.waitForTimeout(500)
    if(num%20 === 0){
      tgl = that.kurang1(tgl)
      slash = that.slashToStrip(tgl)
    }
    num++
  }
  await td.click()
  // await that.page.waitForTimeout(500)
}

exports._pilihOpsi = async ({ that, element, pilihan }) => {
  await that.page.focus(`#${element}`);
  await that.page.click(`#${element}`);
  await that.page.waitForTimeout(500)

  let num = Number(pilihan) - 1

  // console.log(num)

  while(num){
    await that.page.keyboard.press('ArrowDown')
    await that.page.waitForTimeout(500)
    num--
  }

  await that.page.keyboard.press('Enter')


}

exports._clickSelanjutnya = async({ that }) => await that.clickBtn({ text: 'Selanjutnya' })

exports._clickBtn = async({ that, text}) => await that.findXPathAndClick({xpath: `//button[contains(., '${text}')]`});

exports._pushConfirm = async ({ that, confirmData }) => {
  that.spinner.start(`pushConfirm`)
  if(!confirmData.silacak) {
    // push ke silacak
    await that.loginSilacak()

    let exists = await that.cariConfirmByNIK({ nik: confirmData.nik})

    if(!exists){

      // await that.cariKonterByNIK({ nik: confirmData.nik})
      
      await that.catatKonfirmasiBaru({confirmData})
      await that.page.reload()

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
    await that.page.waitForTimeout(500);

    let isKonterInput = await that.page.$('#casenrollment_date')

    while(!isKonterInput){
      await that.loginSilacak()

      await that.page.reload()

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

      // let exists = await that.cariKonterByNIK({ nik: konterData.nik})
  
      // console.log(exists, konter)
  
      await that.clickBtn({ text: 'Tambah'})
  
      await that.page.waitForSelector('#casenrollment_date')
  
      isKonterInput = await that.page.$('#casenrollment_date')
  
    }

    that.spinner.start('siap input')

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

    // await that.page.click('#root > section > section > main > div')

    await that.inputTgl({
      element: 'ContactFactorForm_CcijMqQR3tM',
      tgl: that.kurang1(konterData.tanggal_wawancara || konterData.tanggal_lapor || konterData.tanggal_kontak_dengan_indeks_kasus)
    })

    // await that.page.click('#root > section > section > main > div')

    await that.inputTgl({
      element: 'ContactFactorForm_eventEntryReqDate',
      tgl: that.tambah1(konterData.tanggal_wawancara || konterData.tanggal_lapor || konterData.tanggal_kontak_dengan_indeks_kasus)
    })

    // await that.page.click('#root > section > section > main > div')

    await that.inputTgl({
      element: 'ContactFactorForm_eventExitReqDate',
      tgl: that.tambah6(konterData.tanggal_wawancara || konterData.tanggal_lapor || konterData.tanggal_kontak_dengan_indeks_kasus)
    })

    await that.pilihOpsi({
      element: 'ContactFactorForm_iZ4G8QnSTqB',
      pilihan: konterData.hubungan_dengan_indeks_kasus
    })

    
    await that.pilihOpsi({
      element: 'ContactFactorForm_Y6Iseq8vUlU',
      pilihan: konterData.kategori_kontak_erat
    })

    await that.clickBtn({ text: 'Simpan'})

    await that.page.waitForResponse(response=> response.status() === 200)

    // await that.page.waitForTimeout(500)

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
    that.response = ''
    that.page.on('response', async response => {
      if(response.status() === 200 && response.request().resourceType()=== 'xhr' && response.url().includes('.json')){
        for ( let el of [...await that.page.$$(`div.ant-notification`)]) {
          let notif = await that.page.evaluate( el => el.innerText, el)
          if(notif && notif.length){
            that.response = notif
          }
        }
      }
    })
    
    await that.page.goto(`${that.config.SILACAK_URL}`, waitOpt)
    
  }




}