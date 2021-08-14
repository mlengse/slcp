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
  let visible = false
  while(!visible){
    for(let el of await that.page.$x(xpath)){
      visible = await that.isVisible({ el })
      if(visible){
        // await el.focus()
        await el.evaluate( el => el.click())
      }
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
  // that.spinner.start(`getPicker`)
  let pickerElement
  while(!pickerElement){
    await that.page.waitForTimeout(500)
    let pickerElements = await that.page.$$('div.ant-picker-dropdown')
    that.spinner.start(`pickerElements.length ${[...pickerElements].length}`)
    for(let [id, pick] of Object.entries([...pickerElements])){
      let cl = await that.isVisible({ el: pick})
      // that.spinner.start(`pickerElement ${id} visibility: ${cl}`)
      if(cl){
        pickerElement = pick
        return pickerElement
      }
    }
  
  }


}

exports._inputTgl = async ({ that, element, tgl }) => {
  that.spinner.start(`element: ${element}, tgl: ${tgl}`)
  let blnThn = that.changeToSlcBlnThn(tgl)
  that.spinner.start(`element: ${element}, tgl: ${tgl}, blnThn ${blnThn}`)
  await that.page.click(`#${element}`);
  await that.page.waitForTimeout(500)
  let slash = that.slashToStrip(tgl)
  let pickerElement = await that.getPicker()
  let blnThnDef = await pickerElement.$eval('div.ant-picker-header-view', el => el.innerText)
  let diff = that.getTglDiff(blnThnDef, blnThn)
  that.spinner.start(`element: ${element}, tgl: ${tgl}, blnThn: ${blnThn}, blnThnDef: ${blnThnDef}, diff: ${diff}, slash: ${slash}`)
  let left = await pickerElement.$('button.ant-picker-header-prev-btn > span')
  while (diff !== 0 && blnThn !== blnThnDef){
    pickerElement = await that.getPicker()
    blnThnDef = await pickerElement.$eval('div.ant-picker-header-view', el => el.innerText)
    diff = that.getTglDiff(blnThnDef, blnThn)
    left = await pickerElement.$('button.ant-picker-header-prev-btn > span.ant-picker-prev-icon')
    if(left){
      await left.click()
      await that.page.waitForTimeout(500)
      blnThnDef = await pickerElement.$eval('div.ant-picker-header-view', el => el.innerText)
      diff = that.getTglDiff(blnThnDef, blnThn)
      that.spinner.start(`element: ${element}, tgl: ${tgl}, blnThn: ${blnThn}, blnThnDef: ${blnThnDef}, diff: ${diff}, slash: ${slash}`)
    }
  }
  // await that.page.waitForTimeout(500)
  let td, tgll
  let num = 0
  while(!td){
    let tds = await that.page.$x(`//td[contains(@title, '${slash}')]`)
    if(tds.length) for(let tt of tds){
      let tdVis = await that.isVisible({ el: tt })
      if(tdVis){
        td = tt
        tgll = await td.evaluate( el => el.innerText)
      }
      that.spinner.start(`tdVis: ${tdVis}, tgll: ${tgll}, slash: ${slash}`)
    }
    if(num%20 === 0){
      tgl = that.kurang1(tgl)
      slash = that.slashToStrip(tgl)
    }
    await that.page.waitForTimeout(500)
    num++
  }
  await td.click()
  await that.page.waitForTimeout(500)
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

exports._gotoKonterTab = async({ that }) => {
  let [kontakErat] = await that.page.$x("//div[contains(@class, 'ant-tabs-tab') and contains(.,'Kontak')]")
  while(!kontakErat){
    [kontakErat] = await that.page.$x("//div[contains(@class, 'ant-tabs-tab') and contains(.,'Kontak')]")
  }

  await kontakErat.click()

}

exports._loginSilacak = async ({ that }) => {
  await that.initBrowser()

  let needLogin = await that.page.$('input#username')

  if(needLogin) {
    that.spinner.start('login silacak')
    await that.page.type('input#username', that.config.SILACAK_USER)
    await that.page.type('input#password', that.config.SILACAK_PASSWORD, { delay: 100 })
    await that.page.click('button.btn.btn-login[name="loginbtn"][type="submit"]', {delay: 500})
    await that.page.waitForNavigation()
    that.spinner.succeed('logged in')
  
  }

}

exports._initBrowser = async ({ that }) => {
  if(!that.Browser) {
    that.Browser = await pptr.launch(that.config.pptrOpt)
    that.pages = await that.Browser.pages()
    that.page = that.pages[0]
    
    await that.page.goto(`${that.config.SILACAK_URL}`, waitOpt)
    
  }




}