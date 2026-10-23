import en from './translations/en.json';
import fr from './translations/fr.json';

test('les dictionnaires français et anglais ont les mêmes clés', () => {
  expect(Object.keys(fr.translation).sort()).toEqual(Object.keys(en.translation).sort());
});
