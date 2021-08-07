const pptr = require('puppeteer-core')
const waitOpt = {
  waitUntil: 'networkidle2',
  timeout: 0
}

exports.waitOpt = waitOpt      
exports._waitNav = async ({ that }) => await that.page.waitForNavigation(waitOpt)

exports._pushConfirm = async ({ that, confirmData }) => {
  if(!confirmData.silacak) {
    // push ke silacak
    await that.loginSilacak()

    if(await that.page.$('#root > section > section > main > div > div > div.ant-space.ant-space-horizontal.ant-space-align-baseline > div:nth-child(1) > button')) {
      await that.page.click('#root > section > section > main > div > div > div.ant-space.ant-space-horizontal.ant-space-align-baseline > div:nth-child(1) > button')
    }

    let [hapus] = await that.page.$x("//button[contains(., 'Hapus')]");
    if (hapus) {
      await hapus.click();
    }

    // await that.page.type('input#nik', '3372026504730002')
    await that.page.type('input#nik', confirmData.nik)
    let [filter] = await that.page.$x("//button[contains(., 'Filter')]");
    if (filter) {
      await filter.click()
      await that.page.waitForTimeout(500)
      let table = await that.page.$x("//table[contains(., 'Nama')]")
      if(table[0]){
        let jso = await that.page.evaluate( el => el.innerText, table[0])
        if(jso.includes(confirmData.nik)){
          console.log(jso)
        } else {
          let [baru] = await that.page.$x("//button[contains(., 'Catat Kasus')]");
          if (baru) {
            await baru.click();
          }
      
        }

      }

    }


  }

}
exports._pushKonter = async ({ that, konterData }) => {
  if(!konterData.silacak) {
    await that.loginSilacak()

  }
}

exports._loginSilacak = async ({ that }) => {
  !that.Browser && await that.initBrowser()

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
  
  }

  that.pages = await that.Browser.pages()

  that.page = that.pages[0]
  await that.page.goto(`${that.config.SILACAK_URL}`, waitOpt)

}