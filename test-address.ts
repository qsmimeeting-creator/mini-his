import { searchAddressBySubDistrict } from 'thai-address-universal';

async function test() {
  const result = await searchAddressBySubDistrict('บางกะปิ');
  console.log(result);
}

test();
