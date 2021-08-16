const FileSync = require('lowdb/adapters/FileSync')
const people = require('lowdb')(new FileSync('./db/people.json'))
people.defaults({ people: [] }).write()    

exports.getPersonJSON = nik => (people.get('people').filter({ nik }).value())[0]
exports.upsertPersonJSON = person => {
  !!this.getPersonJSON(person.nik) ? people.get('people').filter({ nik: person.nik }).assign(person).write() : people.get('people').push(person).write()
  return this.getPersonJSON(person.nik)
}
