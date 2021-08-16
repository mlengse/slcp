exports._cariConfirmByNIK = async ({ that, confirmData }) => {
  that.spinner.start(`cariConfirmByNIK ${confirmData.nik}`)
  let exists

  if(confirmData.konfirm_silacak && confirmData.href){
    exists = true
  } else {
    await that.reload()

    // that.spinner.start(`cariConfirmByNIK nik: ${nik}`)
    // await that.page.type('input#nik', '3372026504730002')
    await that.page.type('input#nik', confirmData.nik)
  
    await that.clickBtn({ text: 'Filter'})
  
    await that.page.waitForTimeout(500)
    //   that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
    // ])
  
    // console.log(JSON.stringify(that.response[that.response.length-1].json))
    let [table] = await that.page.$x("//table[contains(., 'Nama')]")
    while(!table){
      await that.page.waitForTimeout(500)
      ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
    }
    await that.page.waitForTimeout(500)
    exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, confirmData.nik)
  
    if(!exists){
      await that.pushConfirm({ confirmData })
  
      await that.reload()
      
      await that.page.type('input#nik', confirmData.nik)
    
      await that.clickBtn({ text: 'Filter'})
    
      await that.page.waitForTimeout(500)
      //   that.page.waitForResponse(response=>response.url().includes(`${nik}`) && response.status() === 200)
      // ])
    
      // console.log(JSON.stringify(that.response[that.response.length-1].json))
      ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
      while(!table){
        await that.page.waitForTimeout(500)
        ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
      }
      await that.page.waitForTimeout(500)
      exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, confirmData.nik)
    
    }
  
  }

  // that.spinner.succeed(`cariConfirmByNIK nik: ${nik}, exists: ${exists}`)
  return exists
}

