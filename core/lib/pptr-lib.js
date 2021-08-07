const pptr = require('puppeteer-core')
const waitOpt = {
  waitUntil: 'networkidle0',
  // timeout: 0
}

exports.waitOpt = waitOpt      
exports._waitNav = async ({ that }) => await that.page.waitForNavigation(waitOpt)

exports._pushConfirm = async ({ that, confirmData }) => {
  if(!confirmData.silacak) {
    // push ke silacak
    await that.loginSilacak()

    let exists = await that.cariConfirmByNIK({ nik: confirmData.nik})

    if(!exists){
      let [baru] = await that.page.$x("//button[contains(., 'Catat Kasus')]");
      while(!baru){
        [baru] = await that.page.$x("//button[contains(., 'Catat Kasus')]");
      }
      await baru.click();
      await that.page.waitForSelector('#root > section > section > main > div > div > div.ant-space.ant-space-horizontal.ant-space-align-baseline > div:nth-child(1) > button')
      // console.log('input', confirmData.nik, confirmData.nama)

      let tgl_onset = that.changeToSlcTgl(confirmData.tgl_onset)
      // console.log(confirmData.nik, confirmData.nama, tgl_onset)

      await that.page.evaluate( tgl => {
        document.getElementById('casenrollment_date').value = tgl
      }, tgl_onset)


      let [lanjut] = await that.page.$x("//button[contains(., 'Selanjutnya')]");
      while(!lanjut){
        [lanjut] = await that.page.$x("//button[contains(., 'Selanjutnya')]");
      }

      await lanjut.click()

      await that.page.waitForSelector('#CovidCaseProfileForm_mHwPpgxFDge')

      await that.page.type('#CovidCaseProfileForm_mHwPpgxFDge', confirmData.nik)
      await that.page.type('#CovidCaseProfileForm_GdwLfGObIRT', confirmData.nama)

      confirmData.umur = that.umur(confirmData.nik.substring(8, 12)).toString()


      await that.page.type('#CovidCaseProfileForm_fk5drl1hTvc', confirmData.umur)
      await that.page.type('#CovidCaseProfileForm_quJD4An7Kmi', confirmData.alamat_sesuai_identitas)
      await that.page.type('#CovidCaseProfileForm_e25qAod3KTg', confirmData.alamat_domisili)
      await that.page.type('#CovidCaseProfileForm_YlOp8W4FYRH', confirmData.no_hp)

      confirmData.jk = confirmData.jk.toLowerCase() === 'l' ? 'Laki' : 'Perempuan'

      let jkbtn = await that.page.$x(`//label[contains(., '${confirmData.jk}')]`)
      jkbtn[0] && await jkbtn[0].click()

      console.log(confirmData)

      await that.page.waitForTimeout(5000)


      // let [periksa] = await that.page.$x("//button[contains(., 'Periksa NIK')]");
      // while(!periksa){
      //   [periksa] = await that.page.$x("//button[contains(., 'Periksa NIK')]");
      // }

      // await periksa.click()

    

      await that.page.click('#root > section > section > main > div > div > div.ant-space.ant-space-horizontal.ant-space-align-baseline > div:nth-child(1) > button')
    } 


  }
  that.spinner.succeed(`sudah ada ${confirmData.nik} ${confirmData.nama}`)

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