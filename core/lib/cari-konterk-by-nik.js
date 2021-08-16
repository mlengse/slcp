exports._cariKonterByNIK = async ({ that, nik }) => {
  that.spinner.start(`cariKonterByNIK ${nik}`)

  // await that.page.waitForTimeout(1000)

  await that.reload()

  await that.findXPathAndClick({ xpath: `//span[contains(.,'2. Kontak Erat')]`})

  // // await that.page.waitForTimeout(5000)

  await that.waitFor({selector: 'input#nik'})
  // // await that.page.type('input#nik', '3372026504730002')
  await that.page.type('input#nik', nik)

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
