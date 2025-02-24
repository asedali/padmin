// const pb = new PocketBase('https://parsai.pockethost.io');
const pb = new PocketBase('https://app.parsayigold.ir');
function iranianDate(sysDate){
let utcDate = new Date(sysDate);

// Format for Iran Standard Time (IRST)
let iranDate = new Intl.DateTimeFormat('fa-IR', {
  timeZone: 'Asia/Tehran',  // Iran timezone
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(utcDate);

return(iranDate);
}

// // Override console.log to show alert
// console.log = function(message) {
//     alert("Log: " + message);
// };

// // Override console.error to show alert
// console.error = function(message) {
//     alert("Error: " + message);
// };

// // Similarly, you can override other methods like console.warn if needed
// console.warn = function(message) {
//     alert("Warning: " + message);
// };

let adminToken = 0;

var name = "";
// localStorage.setItem('userToken', 'token');
// var token="token";
let tradesCurrentPage = 1;
let rejectCurrentPage = 1;
let accCurrentPage = 1;
let deliveryCurrentPage = 1;
let transactionCurrentPage = 1;

const itemsPerPage = 10;
let tradesTotalItems = 0;
let tradesTotalPages = 0;
let rejectTotalItems = 0;
let rejectTotalPages = 0;
let accTotalItems = 0;
let accTotalPages = 0;
let deliveryTotalItems = 0;
let deliveryTotalPages = 0;
let transactionTotalItems = 0;
let transactionTotalPages = 0;

const showStatus = {
    accepted: 'تایید شده',
    failed: 'رد شده',
    pending: 'در حال بررسی',
}

function checkLogin() {
    if (pb.authStore.isValid) {
        console.log("login true");
        document.getElementById("main-content").style.display = "block";
        document.getElementById("login-container").style.display = "none";
        main();
    } else {
        console.log("not login");
        document.getElementById("login-container").style.display = "block";
        document.getElementById("main-content").style.display = "none";
        document.getElementById('loading-overlay').style.display = 'none';
    }
}
async function login() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    var loginMessage = document.getElementById('login-message');
    const loginButton = document.getElementById('login');
    loginButton.disabled = true;
    loginButton.value = 'در حال ورود';

    try {
        // Authenticate the user
        await pb.admins.authWithPassword(email, password);
        loginMessage.style.color = 'green';
        loginMessage.textContent = 'با موفقیت وارد شدید';
        loginButton.disabled = false;
        loginButton.value = 'ورود به برنامه';
        checkLogin();
        // main();
    } catch (error) {
        loginMessage.style.color = 'red';
        loginButton.disabled = false;
        loginButton.value = 'ورود به برنامه';
        loginMessage.textContent = 'ورود ناموفق';
        console.error("Login error:", error);
    }
}

// Function to log out
function logout() {
    pb.authStore.clear();  // Clear the authentication data
    checkLogin();  // Update the UI to show the login form
}

function checkInternetConnection() {
    // Check if navigator is online
    if (navigator.onLine) {
        // Hide alert and show app content
        document.getElementById("no-internet").style.display = "none";
        // document.getElementById("app-content").style.display = "block";
    } else {
        // Show alert and hide app content
        document.getElementById("no-internet").style.display = "flex";
        // document.getElementById("app-content").style.display = "none";
    }
}


// async function getAdminToken(email, password) {
//     const url = "https://parsai.pockethost.io/api/admins/auth-with-password";

//     const response = await fetch(url, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             identity: email,
//             password: password
//         })
//     });

//     if (!response.ok) {
//         console.log(`Error: ${response.statusText}`);
//         throw new Error(`Error: ${response.statusText}`);
//     }

//     const data = await response.json();
//     return data.token;
// }



async function main() {
    console.log("Start main function");
    try {
    // Fetch initial data
    await defaultInput();

    // Set up a single interval for periodic data fetching
// Define the function to fetch data
const fetchAllData = async () => {
    try {
        await tradesFetchData(tradesCurrentPage);
        await accFetchData(accCurrentPage);
        await rejectFetchData(rejectCurrentPage);
        await deliveryFetchData(deliveryCurrentPage);
        await transactionFetchData(deliveryCurrentPage);
        await bankTotalView();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

// Run the function immediately the first time
fetchAllData();

// Set up the interval to run every 5 seconds
const intervalId = setInterval(fetchAllData, 5000);

    // Event listener for bazar switch
    document.getElementById('bazarSwitch').addEventListener('change', function () {
        const newBazar = this.checked ? 1 : 0;
        updateBazar(newBazar);
    });

    // Event listener for state switch
    document.getElementById('stateSwitch').addEventListener('change', function () {
        const newState = this.checked ? 1 : 0;

        // Clear the existing interval if the state is toggled off
        if (newState === 0) {
            clearInterval(intervalId);
            intervalId = null;
        } else {
            // If the state is toggled on, start a new interval for defaultInput
            if (!intervalId) {
                intervalId = setInterval(async () => {
                    try {
                        await defaultInput();
                    } catch (error) {
                        console.error('Error fetching default input:', error);
                    }
                }, 2000);
            }
        }

        // Update the state
        updateState(newState);
    });
    } catch (error) {
        console.error('Error during data fetch:', error);
    } finally {
        // Remove the loading overlay after all processes are complete
        document.getElementById('loading-overlay').style.display = 'none';
    }
}


async function setupRealTimeUpdates(collectionName, ...fetchDataFunctions) {

    pb.collection(collectionName).subscribe('*', async function (e) {
            for (const fetchDataFunction of fetchDataFunctions) {
                try {
                    await fetchDataFunction(1); // Await each fetchDataFunction with the argument 1
                } catch (error) {
                    console.error('Error in fetchDataFunction:', error);
                }
            }
    });
}

const goldName = {
    money: 'پول',
    gold: 'آبشده (گرم)',
    quad_nor: 'ربع سکه ۸۶',
    quad_bank: 'ربع سکه ۴۰۳',
    half_nor: 'نیم سکه ۸۶',
    half_bank: 'نیم سکه ۴۰۳',
    coin_nor: 'تمام سکه ۸۶',
    coin_bank: 'تمام سکه ۴۰۳',
};
async function tradesFetchData(page) {
    try {
        // Fetch records from the 'trades' collection
        const result = await pb.collection('trades').getList(page, itemsPerPage, {
            filter: 'status = "pending"', // Filter records by status
            sort: '-created', // Sort by creation date in descending order
        });

        // Update global variables
        tradesTotalItems = result.totalItems;
        tradesTotalPages = Math.ceil(tradesTotalItems / itemsPerPage);

        // Display the fetched data
        tradesDisplayData(result.items);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
function tradesDisplayData(items) {
    const tbody = document.querySelector('#tradesTable tbody');
    tbody.innerHTML = '';
    items.forEach(item => {
        let itemUnitPrice ="";
        if(item.type === 'gold'){
            itemUnitPrice = item.unitPrice.toLocaleString("en-US")+"<br><b>("+rr(item.unitPrice*4.331802).toLocaleString("en-US")+")</b>";
        } else {
            itemUnitPrice = item.unitPrice.toLocaleString("en-US");
        }

        const createdat=iranianDate(item.created);
                const row1 = document.createElement('tr');
                row1.classList.add("w3-light-blue");
                row1.classList.add('w3-center');
                row1.innerHTML = `
                <td class="w3-center">${item.buysell}</td>
                <td class="w3-center">${goldName[item.type]}</td>
                <td class="w3-center">${item.name}</td>
            `;
            const row2 = document.createElement('tr');
              row2.classList.add("w3-pale-blue");
                row2.classList.add('w3-center');
                row2.innerHTML = `
                <td class="w3-center">${item.amount}</td>
                <td class="w3-center">${itemUnitPrice}</td>
                <td class="w3-center">${item.price.toLocaleString("en-US")}</td>
            `;

             const row3 = document.createElement('tr');
              row3.classList.add("w3-light-grey");
                row3.classList.add('w3-center');
                row3.innerHTML = `
                <td onclick="rowFunction('${item.id}','accepted','${item.user}','${item.amount}','${item.type}','${item.price}','${item.buysell}')" class="w3-center w3-green">تایید</td>
                <td class="w3-center">${createdat}</td>
                <td onclick="rowFunction('${item.id}','failed','${item.user}','${item.amount}','${item.type}','${item.price}','${item.buysell}')" class="w3-center w3-red">رد</td>
            `;
                // });
                const row4 = document.createElement('tr');
                row4.classList.add("w3-light-grey");
                // row.classList.add(`${colorTD} w3-center`);
                row4.classList.add('w3-center');
                row4.innerHTML = `
                <td class="w3-center"></td>
                <td class="w3-center"></td>
                <td class="w3-center"></td>
            `;
                tbody.appendChild(row1);
                tbody.appendChild(row2);
                tbody.appendChild(row3);
                tbody.appendChild(row4);
            // })
            // .catch(error => console.error(error));

    });
    // console.log('total page:'+tradesTotalPages);
    // console.log('current  page:'+tradesCurrentPage);
document.getElementById('tradesCurrentPage').textContent = tradesCurrentPage;
    document.getElementById('tradesPrevButton').disabled = tradesCurrentPage === 1;
    document.getElementById('tradesNextButton').disabled = tradesCurrentPage === tradesTotalPages;
}

function tradesNextPage() {
    // console.log("next page");
    //             console.log('total page:'+tradesTotalPages);
    // console.log('current  page:'+tradesCurrentPage);

    if (tradesCurrentPage < tradesTotalPages) {

    //         console.log('total page:'+tradesTotalPages);
    // console.log('current  page:'+tradesCurrentPage);

        tradesCurrentPage++;

    //         console.log('total page:'+tradesTotalPages);
    // console.log('current  page:'+tradesCurrentPage);

        tradesFetchData(tradesCurrentPage);
    }
}

function tradesPrevPage() {
    if (tradesCurrentPage > 1) {
        tradesCurrentPage--;
        tradesFetchData(tradesCurrentPage);
    }
}








async function accFetchData(page) {
    try {
        // Fetch records from the 'trades' collection
        const result = await pb.collection('trades').getList(page, itemsPerPage, {
            filter: 'status = "accepted"', // Filter records by status
            sort: '-created', // Sort by creation date in descending order
        });

        // Update global variables
        accTotalItems = result.totalItems;
        accTotalPages = Math.ceil(accTotalItems / itemsPerPage);

        // Display the fetched data
        accDisplayData(result.items);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function accDisplayData(items) {
    const tbody = document.querySelector('#accTable tbody');
    tbody.innerHTML = '';
    // tbody.classList.add('w3-center');
    items.forEach(item => {
        const row = document.createElement('tr');
        // const createdat = moment(new Date(item.created).toLocaleString(), 'M/D/YYYY, h:mm:ss A')
        //     .locale('fa')
        //     .format('YYYY/M/D HH:mm:ss');

        const createdat=iranianDate(item.created);
        //    fetchUsernameById(item.user);

        // const headers = new Headers({
        //     Authorization: `Bearer ${adminToken}`
        // });
        // const apiUrl = 'https://parsai.pockethost.io/api/collections/users/records/';
        // const url = `${apiUrl}${item.user}`;
        // fetch(url, {
        //         headers
        //     })
        //     .then(response => response.json())
        //     .then(user => {
                row.classList.add("w3-light-green");
                // row.classList.add(`${colorTD} w3-center`);
                row.classList.add('w3-center');
                row.innerHTML = `
                <td class="w3-center">${item.buysell}</td>
                <td class="w3-center">${item.name}</td>
                <td class="w3-center">${goldName[item.type]}</td>
                <td class="w3-center">${item.amount}</td>
                <td class="w3-center">${item.unitPrice.toLocaleString("en-US")}</td>
                <td class="w3-center">${item.price.toLocaleString("en-US")}</td>
                <td class="w3-center">${createdat}</td>
            `;
                // });
                tbody.appendChild(row);
            // })
            // .catch(error => console.error(error));

    });
    // console.log('total page:'+tradesTotalPages);
    // console.log('current  page:'+tradesCurrentPage);
document.getElementById('accCurrentPage').textContent = accCurrentPage;
    document.getElementById('accPrevButton').disabled = accCurrentPage === 1;
    document.getElementById('accNextButton').disabled = accCurrentPage === accTotalPages;
}

function accNextPage() {
    if (accCurrentPage < accTotalPages) {
        accCurrentPage++;
        accFetchData(accCurrentPage);
    }
}

function accPrevPage() {
    if (accCurrentPage > 1) {
        accCurrentPage--;
        accFetchData(accCurrentPage);
    }
}

async function rejectFetchData(page) {

    try {
        // Fetch records from the 'trades' collection
        const result = await pb.collection('trades').getList(page, itemsPerPage, {
            filter: 'status = "failed"', // Filter records by status
            sort: '-created', // Sort by creation date in descending order
        });

        // Update global variables
        rejectTotalItems = result.totalItems;
        rejectTotalPages = Math.ceil(rejectTotalItems / itemsPerPage);

        // Display the fetched data
        rejectDisplayData(result.items);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function rejectDisplayData(items) {
    const tbody = document.querySelector('#rejectTable tbody');
    tbody.innerHTML = '';
    // tbody.classList.add('w3-center');
    items.forEach(item => {
        const row = document.createElement('tr');
        // const createdat = moment(new Date(item.created).toLocaleString(), 'M/D/YYYY, h:mm:ss A')
        //     .locale('fa')
        //     .format('YYYY/M/D HH:mm:ss');

        const createdat=iranianDate(item.created);
        //    fetchUsernameById(item.user);

        // const headers = new Headers({
        //     Authorization: `Bearer ${adminToken}`
        // });
        // const apiUrl = 'https://parsai.pockethost.io/api/collections/users/records/';
        // const url = `${apiUrl}${item.user}`;
        // fetch(url, {
        //         headers
        //     })
        //     .then(response => response.json())
        //     .then(user => {
                row.classList.add("w3-red");
                // row.classList.add(`${colorTD} w3-center`);
                row.classList.add('w3-center');
                row.innerHTML = `
                <td class="w3-center">${item.buysell}</td>
                <td class="w3-center">${item.name}</td>
                <td class="w3-center">${goldName[item.type]}</td>
                <td class="w3-center">${item.amount}</td>
                <td class="w3-center">${item.unitPrice.toLocaleString("en-US")}</td>
                <td class="w3-center">${item.price.toLocaleString("en-US")}</td>
                <td class="w3-center">${createdat}</td>
            `;
                // });
                tbody.appendChild(row);
            // })
            // .catch(error => console.error(error));

    });
    // console.log('total page:'+tradesTotalPages);
    // console.log('current  page:'+tradesCurrentPage);
document.getElementById('rejectCurrentPage').textContent = rejectCurrentPage;

    document.getElementById('rejectPrevButton').disabled = rejectCurrentPage === 1;
    document.getElementById('rejectNextButton').disabled = rejectCurrentPage === rejectTotalPages;
}

function rejectNextPage() {
    if (rejectCurrentPage < rejectTotalPages) {
        rejectCurrentPage++;
        rejectFetchData(rejectCurrentPage);
    }
}

function rejectPrevPage() {
    if (rejectCurrentPage > 1) {
        rejectCurrentPage--;
        rejectFetchData(rejectCurrentPage);
    }
}






async function deliveryFetchData(page) {
    try {
        // Fetch records from the 'delivery' collection
        const result = await pb.collection('delivery').getList(page, itemsPerPage, {
            sort: '-created', // Sort by creation date in descending order
        });

        // Update global variables
        deliveryTotalItems = result.totalItems;
        deliveryTotalPages = Math.ceil(deliveryTotalItems / itemsPerPage);

        // Display the fetched data
        deliveryDisplayData(result.items);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function deliveryDisplayData(items) {
    const tbody = document.querySelector('#deliveryTable tbody');
    tbody.innerHTML = '';
    items.forEach(item => {
        const row = document.createElement('tr');
        const createdat=iranianDate(item.created);
       
       
        if(item.status == "accepted"){
            // status ="تایید شده";
            row.classList.add("w3-pale-green");
        } else if(item.status == "failed"){
            // status ="لغو شده";
        row.classList.add("w3-pale-red");
    } else{
        row.classList.add("w3-pale-yellow");
    }
                row.classList.add('w3-center');
                row.innerHTML = `
                <td class="w3-center">${item.name}</td>
                <td class="w3-center">${goldName[item.type]}</td>
                <td class="w3-center">${item.amount}</td>
                <td class="w3-center">${parseFloat(item.deliverycost).toLocaleString("en-US")}</td>
                <td class="w3-center">${createdat}</td>
                <td class="w3-center">${showStatus[item.status]}</td>
                <td class="w3-center">----</td>

            `;
                // });
                tbody.appendChild(row);
            // })
            // .catch(error => console.error(error));

    });
    // console.log('total page:'+tradesTotalPages);
    // console.log('current  page:'+tradesCurrentPage);
document.getElementById('deliveryCurrentPage').textContent = deliveryCurrentPage;
    document.getElementById('deliveryPrevButton').disabled = deliveryCurrentPage === 1;
    document.getElementById('deliveryNextButton').disabled = deliveryCurrentPage === deliveryTotalPages;
}

function deliveryNextPage() {
    if (deliveryCurrentPage < deliveryTotalPages) {
        deliveryCurrentPage++;
        deliveryFetchData(deliveryCurrentPage);
    }
}

function deliveryPrevPage() {
    if (deliveryCurrentPage > 1) {
        deliveryCurrentPage--;
        deliveryFetchData(deliveryCurrentPage);
    }
}






async function transactionFetchData(page) {

    try {
        // Fetch records from the 'transactions' collection
        const result = await pb.collection('transactions').getList(page, itemsPerPage, {
            sort: '-created', // Sort by creation date in descending order
        });

        // Update global variables
        transactionTotalItems = result.totalItems;
        transactionTotalPages = Math.ceil(transactionTotalItems / itemsPerPage);

        // Display the fetched data
        transactionDisplayData(result.items);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function transactionDisplayData(items) {
    const tbody = document.querySelector('#transactionTable tbody');
    tbody.innerHTML = '';
    items.forEach(item => {
        const row = document.createElement('tr');
        const createdat=iranianDate(item.created);
                row.classList.add("w3-pale-yellow");
                row.classList.add('w3-center');
                row.innerHTML = `
                <td class="w3-center">${item.name}</td>
                <td class="w3-center">${goldName[item.type]}</td>
                <td style="text-align: center; direction: ltr;">${parseFloat(item.amount).toLocaleString("en-US")}</td>
                <td class="w3-center">${item.comment}</td>
                <td class="w3-center">${createdat}</td>
            `;
                // });
                tbody.appendChild(row);
            // })
            // .catch(error => console.error(error));

    });

document.getElementById('transactionCurrentPage').textContent = transactionCurrentPage;
    document.getElementById('transactionPrevButton').disabled = transactionCurrentPage === 1;
    document.getElementById('transactionNextButton').disabled = transactionCurrentPage === transactionTotalPages;
}

function transactionNextPage() {
    if (transactionCurrentPage < transactionTotalPages) {
        transactionCurrentPage++;
        transactionFetchData(transactionCurrentPage);
    }
}

function transactionPrevPage() {
    if (transactionCurrentPage > 1) {
        transactionCurrentPage--;
        transactionFetchData(transactionCurrentPage);
    }
}




//   // Set up the request payload
// const payload = {
//     type,
//     price,
//     amount
//   };

// Set up the request options
// const options = {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
// },
//     body: JSON.stringify(payload)
//   };

//   // Send the request
// const response = await fetch('https://parsai.pockethost.io/api/collections/trades/records', options);

//   // Handle the response
// if (response.ok) {
//     const data = await response.json();
//     console.log('Data saved successfully:', data);
//   } else {
//     console.error('Error:', response.status);
//   }
// });



// JavaScript to handle the update functionality
async function rowFunction(recordId, status, user, amount, type, price, buysell) {
    try {
        // Update the record in the 'trades' collection
        await pb.collection('trades').update(recordId, { status });

        // Handle additional logic based on the status
        if (status === "accepted") {
            await bankUpdate(user, amount, type, price, buysell, pb.authStore.token);
        }
        // } else if (status === "failed") {
        //     await bankUpdate_delete_draft(user, amount, type, price, buysell, pb.authStore.token);
        // }

        // Notify the user of success
        alert("تغییرات اعمال شد");

        // Refresh data on the page
        tradesFetchData(tradesCurrentPage);
        accFetchData(accCurrentPage);
        rejectFetchData(rejectCurrentPage);
    } catch (error) {
        console.error("Error updating record:", error);
        alert("مشکلی در تغییر سفارش پیش آمده است");
    }
}


// Function to fetch and display the username by user ID
async function fetchUsernameById(userId) {
    try {
        // Fetch the user record from the 'users' collection
        const user = await pb.collection('users').getOne(userId);

        // Return the username
        return user.name; // Assuming the field for the user's name is `name`
    } catch (error) {
        // Handle any errors that occurred during the fetch
        console.error("Error fetching user:", error);
        return null; // Return null if there was an error
    }
}

async function defaultFormula() {

    try {
        // Fetch all records from the 'formula' collection
        const result = await pb.collection('formula').getFullList();

        // Check if there are any records
        if (result.length > 0) {
            const formulaData = result[0]; // Get the first record

            // Update the input element's values with the formula data
            document.getElementById('FFgold').value = formulaData.gold;
            document.getElementById('FFquadN').value = formulaData.quad_nor;
            document.getElementById('FFhalfN').value = formulaData.half_nor;
            document.getElementById('FFcoinN').value = formulaData.coin_nor;
            document.getElementById('FFquadB').value = formulaData.quad_bank;
            document.getElementById('FFhalfB').value = formulaData.half_bank;
            document.getElementById('FFcoinB').value = formulaData.coin_bank;
        } else {
            console.error("No records found in the 'formula' collection.");
        }
    } catch (error) {
        console.error("Error fetching formula data:", error);
    }
}

async function updateFormula() {
    try {
        // Get the updated values from the input fields
        const updatedData = {
            gold: document.getElementById('FFgold').value,
            quad_nor: document.getElementById('FFquadN').value,
            half_nor: document.getElementById('FFhalfN').value,
            coin_nor: document.getElementById('FFcoinN').value,
            quad_bank: document.getElementById('FFquadB').value,
            half_bank: document.getElementById('FFhalfB').value,
            coin_bank: document.getElementById('FFcoinB').value,
        };

        // Update the record in the 'values' collection
        await pb.collection('values').update('oknpwa6g8imjgfm', updatedData);

        // Notify the user of success
        alert('فرمول‌ها بروزرسانی شد');
    } catch (error) {
        // Handle any errors that occurred during the update
        console.error("Error updating formula:", error);
        alert('خطا در بروزرسانی فرمول‌ها');
    }
}

async function defaultInput() {
    try {
        // Fetch all records from the 'values' collection
        const result = await pb.collection('values').getFullList();

        // Check if there are any records
        if (result.length > 0) {
            const valuesData = result[0]; // Get the first record

            // Update the input elements with the fetched data
            document.getElementById('stateSwitch').checked = valuesData.state;
            document.getElementById('bazarSwitch').checked = valuesData.bazar;
            document.getElementById('xInput').value = valuesData.x;
            document.getElementById('yInput').value = valuesData.y;
            document.getElementById('zInput').value = valuesData.z;
            document.getElementById('wInput').value = valuesData.w;
            document.getElementById('cInput').value = valuesData.c;
            document.getElementById('FFgold').value = valuesData.gold;
            document.getElementById('FFquadN').value = valuesData.quad_nor;
            document.getElementById('FFhalfN').value = valuesData.half_nor;
            document.getElementById('FFcoinN').value = valuesData.coin_nor;
            document.getElementById('FFquadB').value = valuesData.quad_bank;
            document.getElementById('FFhalfB').value = valuesData.half_bank;
            document.getElementById('FFcoinB').value = valuesData.coin_bank;
            document.getElementById('CCgold').value = valuesData.gold_c;
            document.getElementById('CCquadN').value = valuesData.quad_nor_c;
            document.getElementById('CChalfN').value = valuesData.half_nor_c;
            document.getElementById('CCcoinN').value = valuesData.coin_nor_c;
            document.getElementById('CCquadB').value = valuesData.quad_bank_c;
            document.getElementById('CChalfB').value = valuesData.half_bank_c;
            document.getElementById('CCcoinB').value = valuesData.coin_bank_c;
        } else {
            console.error("No records found in the 'values' collection.");
        }
    } catch (error) {
        console.error("Error fetching values data:", error);
    }
}

async function updateInput() {
    try {
        // Get the updated values from the input fields
        const updatedData = {
            x: document.getElementById('xInput').value,
            y: document.getElementById('yInput').value,
            z: document.getElementById('zInput').value,
            w: document.getElementById('wInput').value,
            c: document.getElementById('cInput').value,
        };

        // Update the record in the 'values' collection
        await pb.collection('values').update('oknpwa6g8imjgfm', updatedData);

        // Notify the user of success
        alert('ورودی‌ها بروزرسانی شد');
    } catch (error) {
        // Handle any errors that occurred during the update
        console.error("Error updating input values:", error);
        alert('خطا در بروزرسانی ورودی‌ها');
    }
}


async function defaultCommission() {
    try {
        // Fetch all records from the 'commission' collection
        const result = await pb.collection('commission').getFullList();

        // Check if there are any records
        if (result.length > 0) {
            const commissionData = result[0]; // Get the first record

            // Update the input element's values with the commission data
            document.getElementById('CCgold').value = commissionData.gold;
            document.getElementById('CCquadN').value = commissionData.quad_nor;
            document.getElementById('CChalfN').value = commissionData.half_nor;
            document.getElementById('CCcoinN').value = commissionData.coin_nor;
            document.getElementById('CCquadB').value = commissionData.quad_bank;
            document.getElementById('CChalfB').value = commissionData.half_bank;
            document.getElementById('CCcoinB').value = commissionData.coin_bank;
        } else {
            console.error("No records found in the 'commission' collection.");
        }
    } catch (error) {
        console.error("Error fetching commission data:", error);
    }
}
async function updateCommission() {
    try {
        // Get the updated values from the input fields
        const updatedData = {
            gold_c: document.getElementById('CCgold').value,
            quad_nor_c: document.getElementById('CCquadN').value,
            half_nor_c: document.getElementById('CChalfN').value,
            coin_nor_c: document.getElementById('CCcoinN').value,
            quad_bank_c: document.getElementById('CCquadB').value,
            half_bank_c: document.getElementById('CChalfB').value,
            coin_bank_c: document.getElementById('CCcoinB').value,
        };

        // Update the record in the 'values' collection
        await pb.collection('values').update('oknpwa6g8imjgfm', updatedData);

        // Notify the user of success
        alert('کارمزدها بروزرسانی شد');
    } catch (error) {
        // Handle any errors that occurred during the update
        console.error("Error updating commission data:", error);
        alert('خطا در بروزرسانی کارمزدها');
    }
}


async function getLastRecordByUser(user) {
    try {
        // Fetch the last record for the specified user from the 'bank' collection
        const result = await pb.collection('bank').getList(1, 1, {
            filter: `user = "${user}"`, // Filter by user
            sort: '-created', // Sort by creation date in descending order
        });

        // Return the last record if it exists, otherwise return null
        return result.items.length > 0 ? result.items[0] : null;
    } catch (error) {
        console.error('Error fetching record:', error);
        return null; // Return null in case of an error
    }
}

async function updateRecord(record, updateValue) {
    if (!record) {
        console.error('No record found for the user');
        return;
    }

    // Add values to each cell
    const updatedRecord = {
        gold: Number(record.gold) + updateValue.gold,
        quad_nor: Number(record.quad_nor) + updateValue.quad_nor,
        quad_bank: Number(record.quad_bank) + updateValue.quad_bank,
        half_nor: Number(record.half_nor) + updateValue.half_nor,
        half_bank: Number(record.half_bank) + updateValue.half_bank,
        coin_nor: Number(record.coin_nor) + updateValue.coin_nor,
        coin_bank: Number(record.coin_bank) + updateValue.coin_bank,
        money: Number(record.money) + updateValue.money, // Update the money field
    };

    try {
        // Update the record in the 'bank' collection
        const result = await pb.collection('bank').update(record.id, updatedRecord);

        console.log('Updated record:', result);
    } catch (error) {
        console.error('Error updating record:', error);
    }
}


async function getLastRecordByUser_draft(user) {
    try {
        // Fetch the last record for the specified user from the 'bank_draft' collection
        const result = await pb.collection('bank_draft').getList(1, 1, {
            filter: `user = "${user}"`, // Filter by user
            sort: '-created', // Sort by creation date in descending order
        });

        // Return the last record if it exists, otherwise return null
        return result.items.length > 0 ? result.items[0] : null;
    } catch (error) {
        console.error('Error fetching record:', error);
        return null; // Return null in case of an error
    }
}
async function updateRecord_draft(record, updateValue) {
    if (!record) {
        console.error('No record found for the user');
        return;
    }

    // Add values to each cell
    const updatedRecord = {
        gold: Number(record.gold) + updateValue.gold,
        quad_nor: Number(record.quad_nor) + updateValue.quad_nor,
        quad_bank: Number(record.quad_bank) + updateValue.quad_bank,
        half_nor: Number(record.half_nor) + updateValue.half_nor,
        half_bank: Number(record.half_bank) + updateValue.half_bank,
        coin_nor: Number(record.coin_nor) + updateValue.coin_nor,
        coin_bank: Number(record.coin_bank) + updateValue.coin_bank,
        money: Number(record.money) + updateValue.money, // Update the money field
    };

    try {
        // Update the record in the 'bank_draft' collection
        const result = await pb.collection('bank_draft').update(record.id, updatedRecord);

        console.log('Updated record:', result);
    } catch (error) {
        console.error('Error updating record:', error);
    }
}
async function bankUpdate(user, amount, type, price, buysell) {
    // Initialize updateValue object
    const updateValue = {
        gold: 0,
        quad_nor: 0,
        quad_bank: 0,
        half_nor: 0,
        half_bank: 0,
        coin_nor: 0,
        coin_bank: 0,
        money: 0,
    };

    // Parse price and amount as floats
    price = parseFloat(price);
    amount = parseFloat(amount);

    // Determine the update values based on the transaction type (buy/sell)
    if (buysell === 'خرید') {
        updateValue.money = -price; // Deduct money for purchase
        updateValue[type] = amount; // Add the purchased amount to the specified type
    } else if (buysell === 'فروش') {
        updateValue.money = price; // Add money for sale
        updateValue[type] = -amount; // Deduct the sold amount from the specified type
    }

    try {
        // Fetch the last record for the user
        const lastRecord = await getLastRecordByUser(user);

        // Update the record with the new values
        if (lastRecord) {
            await updateRecord(lastRecord, updateValue);
        } else {
            console.error('No record found for the user');
        }
    } catch (error) {
        console.error('Error updating bank record:', error);
    }
}


async function bankUpdate_delete_draft(user, amount, type, price, buysell) {
    console.log("bankupdate_delete");

    // Initialize updateValue object
    const updateValue = {
        gold: 0,
        quad_nor: 0,
        quad_bank: 0,
        half_nor: 0,
        half_bank: 0,
        coin_nor: 0,
        coin_bank: 0,
        money: 0,
    };

    // Parse price and amount as floats
    price = parseFloat(price);
    amount = parseFloat(amount);

    // Determine the update values based on the transaction type (buy/sell)
    if (buysell === 'خرید') {
        updateValue.money = price; // Add money for purchase reversal
        updateValue[type] = -amount; // Deduct the purchased amount from the specified type
    } else if (buysell === 'فروش') {
        updateValue.money = -price; // Deduct money for sale reversal
        updateValue[type] = amount; // Add the sold amount to the specified type
    }

    try {
        // Fetch the last record for the user from the 'bank_draft' collection
        const lastRecord = await getLastRecordByUser_draft(user);

        // Update the record with the new values
        if (lastRecord) {
            await updateRecord_draft(lastRecord, updateValue);
        } else {
            console.error('No record found for the user in the draft collection');
        }
    } catch (error) {
        console.error('Error updating draft bank record:', error);
    }
}


async function getCurrentState() {
    const recordId = 'ardeu38dd84l9ch'; // Replace with the actual record ID

    try {
        // Fetch the record from the 'onlineupdate' collection
        const record = await pb.collection('onlineupdate').getOne(recordId);

        // Get the current state from the record
        const currentState = record.state;

        // Set the checkbox state based on the stored value (0 or 1)
        document.getElementById('stateSwitch').checked = currentState;
    } catch (error) {
        console.error('Error fetching state:', error);
    }
}

async function updateState(newState) {
    const recordId = 'oknpwa6g8imjgfm'; // Replace with the actual record ID

    try {
        // Update the state in the 'values' collection
        const updatedRecord = await pb.collection('values').update(recordId, {
            state: newState,
        });

        console.log('State updated successfully:', updatedRecord);
    } catch (error) {
        console.error('Error updating state:', error);
    }
}
async function updateBazar(newState) {
    const recordId = 'oknpwa6g8imjgfm'; // Replace with the actual record ID

    try {
        // Update the bazar state in the 'values' collection
        const updatedRecord = await pb.collection('values').update(recordId, {
            bazar: newState,
        });

        console.log('Bazar updated successfully:', updatedRecord);
    } catch (error) {
        console.error('Error updating bazar:', error);
    }
}

async function updateTransaction() {
    try {
        // Get input values
        const userid = document.getElementById('ttuserid').value;
        const username = document.getElementById('searchInput').value;
        const comment = document.getElementById('comment').value;
        const money = parseFloat(document.getElementById('ttmoney').value) || 0;
        const gold = parseFloat(document.getElementById('ttgold').value) || 0;
        const quad_nor = parseFloat(document.getElementById('ttquadN').value) || 0;
        const half_nor = parseFloat(document.getElementById('tthalfN').value) || 0;
        const coin_nor = parseFloat(document.getElementById('ttcoinN').value) || 0;
        const quad_bank = parseFloat(document.getElementById('ttquadB').value) || 0;
        const half_bank = parseFloat(document.getElementById('tthalfB').value) || 0;
        const coin_bank = parseFloat(document.getElementById('ttcoinB').value) || 0;

        // Check if all values are zero
        if (money === 0 && gold === 0 && quad_nor === 0 && half_nor === 0 && coin_nor === 0 && quad_bank === 0 && half_bank === 0 && coin_bank === 0) {
            alert("هیچ مقداری وارد نشده است.");
            return;
        }

        // Fetch the current record for the user from the 'bank' collection
        const bankRecord = await pb.collection('bank').getFirstListItem(`user="${userid}"`);
        // const draftRecord = await pb.collection('bank_draft').getFirstListItem(`user="${userid}"`);

        // Function to reset all fields except one
        function resetAllExceptOne(data, keyToKeep, newValue) {
            for (const key in data) {
                if (key !== keyToKeep) {
                    data[key] = 0; // Set to zero
                } else {
                    data[key] = newValue; // Set the specified field to the new value
                }
            }
        }

        // Prepare input data
        const inputData = {
            money: money,
            gold: gold,
            quad_nor: quad_nor,
            half_nor: half_nor,
            coin_nor: coin_nor,
            quad_bank: quad_bank,
            half_bank: half_bank,
            coin_bank: coin_bank,
        };

        // Determine the type and amount of the transaction
        let amount = 0;
        let type = "";
        if (money !== 0) {
            amount = money;
            type = "money";
        } else if (gold !== 0) {
            amount = gold;
            type = "gold";
        } else if (quad_nor !== 0) {
            amount = quad_nor;
            type = "quad_nor";
        } else if (half_nor !== 0) {
            amount = half_nor;
            type = "half_nor";
        } else if (coin_nor !== 0) {
            amount = coin_nor;
            type = "coin_nor";
        } else if (quad_bank !== 0) {
            amount = quad_bank;
            type = "quad_bank";
        } else if (half_bank !== 0) {
            amount = half_bank;
            type = "half_bank";
        } else if (coin_bank !== 0) {
            amount = coin_bank;
            type = "coin_bank";
        }

        // Reset all fields except the one being updated
        resetAllExceptOne(inputData, type, amount);

        // Prepare updated data for the 'bank' collection
        const updatedData = {
            money: Number(bankRecord.money) + parseFloat(inputData.money),
            gold: Number(bankRecord.gold) + parseFloat(inputData.gold),
            quad_nor: Number(bankRecord.quad_nor) + parseFloat(inputData.quad_nor),
            half_nor: Number(bankRecord.half_nor) + parseFloat(inputData.half_nor),
            coin_nor: Number(bankRecord.coin_nor) + parseFloat(inputData.coin_nor),
            quad_bank: Number(bankRecord.quad_bank) + parseFloat(inputData.quad_bank),
            half_bank: Number(bankRecord.half_bank) + parseFloat(inputData.half_bank),
            coin_bank: Number(bankRecord.coin_bank) + parseFloat(inputData.coin_bank),
        };

        // Prepare updated data for the 'bank_draft' collection
        // const updatedData_d = {
        //     money: Number(draftRecord.money) + parseFloat(inputData.money),
        //     gold: Number(draftRecord.gold) + parseFloat(inputData.gold),
        //     quad_nor: Number(draftRecord.quad_nor) + parseFloat(inputData.quad_nor),
        //     half_nor: Number(draftRecord.half_nor) + parseFloat(inputData.half_nor),
        //     coin_nor: Number(draftRecord.coin_nor) + parseFloat(inputData.coin_nor),
        //     quad_bank: Number(draftRecord.quad_bank) + parseFloat(inputData.quad_bank),
        //     half_bank: Number(draftRecord.half_bank) + parseFloat(inputData.half_bank),
        //     coin_bank: Number(draftRecord.coin_bank) + parseFloat(inputData.coin_bank),
        // };

        // Update the 'bank_draft' record
        // await pb.collection('bank_draft').update(draftRecord.id, updatedData_d);
        // console.log('Draft record updated successfully');
        // alert('بروزرسانی درفت انجام شد');

        // Update the 'bank' record
        await pb.collection('bank').update(bankRecord.id, updatedData);
        console.log('Bank record updated successfully');
        alert('بروزرسانی انجام شد');

        // Create a new transaction record
        const transaction = {
            user: userid,
            name: username,
            type: type,
            amount: amount,
            comment: comment,
        };
        await pb.collection('transactions').create(transaction);
        console.log('Transaction recorded successfully');
        alert('تراکنش ثبت شد');

        // Reset input fields
        document.getElementById('ttmoney').value = 0;
        document.getElementById('ttgold').value = 0;
        document.getElementById('ttquadN').value = 0;
        document.getElementById('tthalfN').value = 0;
        document.getElementById('ttcoinN').value = 0;
        document.getElementById('ttquadB').value = 0;
        document.getElementById('tthalfB').value = 0;
        document.getElementById('ttcoinB').value = 0;
        document.getElementById('comment').value = "";
    } catch (error) {
        alert('خطا -> شناسه کاربر را چک کنید');
        console.error('Error updating record or sending transaction:', error);
    }
}


const moneyWOC = document.getElementById("ttmoney");
const moneyWC = document.getElementById("moneyWC");

moneyWOC.addEventListener("input", function () {
    // Remove commas and parse the input as a number
    let num = parseFloat(moneyWOC.value.replace(/,/g, ''));

    // Check if the input is a valid number
    if (!isNaN(num)) {
        // Format the number with commas and display it in the div
        moneyWC.textContent = num.toLocaleString("en-US");
    } else {
        moneyWC.textContent = ""; // Clear if input is not valid
    }
});

function rr(num) {
    return (Math.round(num / 1000) * 1000)
    //  return(num)
    // return(intnum.toLocaleString().replace(/,/g, '&nbsp;'))
}

function rrr(num) {
    return (Math.round(num / 10000) * 10000);
    //  return(num)
    // return(intnum.toLocaleString().replace(/,/g, '&nbsp;'))
}

function rrrr(num) {
    return (Math.round(num / 5000) * 5000);
    //  return(num)
    // return(intnum.toLocaleString().replace(/,/g, '&nbsp;'))
}

   document.addEventListener('DOMContentLoaded', () => {
      const searchInput = document.getElementById('searchInput');
      const resultsContainer = document.getElementById('results');
      const userIdDisplay = document.getElementById('ttuserid');

      // Debounce function to limit API calls
      function debounce(func, delay) {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), delay);
        };
      }

async function fetchUsers(query) {

    // Clear results if the query is too short
    if (query.length < 3) {
        resultsContainer.innerHTML = '';
        return;
    }

    try {
        // Fetch users from the 'users' collection where the name matches the query
        const users = await pb.collection('users').getFullList({
            filter: `name ~ '${query}'`, // Filter by name containing the query
        });

        // Display the results
        displayResults(users);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

      // Function to display results
      function displayResults(users) {
        resultsContainer.innerHTML = ''; // Clear previous results
        if (users.length === 0) {
          resultsContainer.innerHTML = '<div class="result-item">هیج کاربری یافت نشد.</div>';
          return;
        }

        users.forEach(user => {
          const resultItem = document.createElement('div');
          resultItem.className = 'result-item';
          resultItem.textContent = user.name;
          resultItem.addEventListener('click', () => {
            searchInput.value = user.name; // Set the input value to the selected name
            userIdDisplay.value = user.id; // Display the selected user's ID
            resultsContainer.innerHTML = ''; // Clear results
          });
          resultsContainer.appendChild(resultItem);
        });
      }

      // Attach debounced input event listener
      searchInput.addEventListener('input', debounce((e) => {
        fetchUsers(e.target.value.trim());
      }, 300));
    });



   document.addEventListener('DOMContentLoaded', () => {
      const searchInput = document.getElementById('userSearchInput');
      const resultsContainer = document.getElementById('userResults');
    const tbody = document.querySelector('#userBankViewTable tbody');
    tbody.innerHTML = '';
      // Debounce function to limit API calls
      function debounce(func, delay) {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), delay);
        };
      }

async function fetchUsers(query) {

    // Clear results if the query is too short
    if (query.length < 3) {
        resultsContainer.innerHTML = '';
        return;
    }

    try {
        // Fetch users from the 'users' collection where the name matches the query
        const users = await pb.collection('users').getFullList({
            filter: `name ~ '${query}'`, // Filter by name containing the query
        });

        // Display the results
        displayResults(users);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

      // Function to display results
      function displayResults(users) {
        resultsContainer.innerHTML = ''; // Clear previous results
        if (users.length === 0) {
          resultsContainer.innerHTML = '<div class="result-item">هیج کاربری یافت نشد.</div>';
          return;
        }

        users.forEach(user => {
          const resultItem = document.createElement('div');
          resultItem.className = 'result-item';
          resultItem.textContent = user.name;
          resultItem.addEventListener('click', async () => {
            searchInput.value = user.name; // Set the input value to the selected name
            // userIdDisplay.value = user.id; // Display the selected user's ID
            resultsContainer.innerHTML = ''; // Clear results

try {
        const records = await pb.collection('bank').getList(1, 1, {
            filter: `user="${user.id}"`, // Assuming 'user' is the field in the bank collection that links to the user
            sort: '-created', // Optionally, sort by created date if necessary
        });

        const item = records.items[0]; // The first (and only) record for the user

        if (item) {

                tbody.innerHTML = `
                <tr class="w3-center"><td class="w3-center">${goldName['money']}</td><td style="text-align: center; direction: ltr;">${Number(item.money).toLocaleString('en-US')}</td></tr>
                <tr class="w3-center"><td class="w3-center">${goldName['gold']}</td><td style="text-align: center; direction: ltr;">${parseFloat(parseFloat(item.gold).toFixed(3)).toLocaleString('en-US')}</td></tr>
                <tr class="w3-center"><td class="w3-center">${goldName['quad_nor']}</td><td style="text-align: center; direction: ltr;">${item.quad_nor.toLocaleString('en-US')}</td></tr>
                <tr class="w3-center"><td class="w3-center">${goldName['half_nor']}</td><td style="text-align: center; direction: ltr;">${item.half_nor.toLocaleString('en-US')}</td></tr>
                <tr class="w3-center"><td class="w3-center">${goldName['coin_nor']}</td><td style="text-align: center; direction: ltr;">${item.coin_nor.toLocaleString('en-US')}</td></tr>
                <tr class="w3-center"><td class="w3-center">${goldName['quad_bank']}</td><td style="text-align: center; direction: ltr;">${item.quad_bank.toLocaleString('en-US')}</td></tr>
                <tr class="w3-center"><td class="w3-center">${goldName['half_nor']}</td><td style="text-align: center; direction: ltr;">${item.half_nor.toLocaleString('en-US')}</td></tr>
                <tr class="w3-center"><td class="w3-center">${goldName['coin_bank']}</td><td style="text-align: center; direction: ltr;">${item.coin_bank.toLocaleString('en-US')}</td></tr>
            `;
        // tbody.appendChild(row);
            // Display the results in HTML elements
            // document.getElementById('bankMoney').textContent = Number(item.money).toLocaleString('en-US');
            // document.getElementById('bankGold').textContent = parseFloat(parseFloat(item.gold).toFixed(3)).toLocaleString('en-US');
            // document.getElementById('bankQuadNor').textContent = item.quad_nor.toLocaleString('en-US');
            // document.getElementById('bankHalfNor').textContent = item.half_nor.toLocaleString('en-US');
            // document.getElementById('bankCoinNor').textContent = item.coin_nor.toLocaleString('en-US');
            // document.getElementById('bankQuadBank').textContent = item.quad_bank.toLocaleString('en-US');
            // document.getElementById('bankHalfBank').textContent = item.half_bank.toLocaleString('en-US');
            // document.getElementById('bankCoinBank').textContent = item.coin_bank.toLocaleString('en-US');
        } else {
            console.log('No bank record found for this user.');
        }

    } catch (error) {
        console.error('Error:', error);
        // alert('Error:', error);
    }



          });
          resultsContainer.appendChild(resultItem);
        });
      }

      // Attach debounced input event listener
      searchInput.addEventListener('input', debounce((e) => {
        fetchUsers(e.target.value.trim());
      }, 300));
    });


function w3_open() {
  document.getElementById("sidebar").style.display = "block";
}

function w3_close() {
  document.getElementById("sidebar").style.display = "none";
}

async function bankTotalView() {
    document.getElementById('bankGold-text').textContent = goldName['gold'];
    document.getElementById('bankQuadNor-text').textContent = goldName['quad_nor'];
    document.getElementById('bankHalfNor-text').textContent = goldName['half_nor'];
    document.getElementById('bankCoinNor-text').textContent = goldName['coin_nor'];
    document.getElementById('bankQuadBank-text').textContent = goldName['quad_bank'];
    document.getElementById('bankHalfBank-text').textContent = goldName['half_bank'];
    document.getElementById('bankCoinBank-text').textContent = goldName['coin_bank'];

    try {
        // Fetch the bank record associated with the current user
        const records = await pb.collection('bank_totals').getFullList();
        const item = records[0]; // The first (and only) record for the user

        if (item) {
            // Display the results in HTML elements
            document.getElementById('bankMoney').textContent = Number(item.total_money).toLocaleString('en-US');
            document.getElementById('bankGold').textContent = parseFloat(parseFloat(item.total_gold).toFixed(3)).toLocaleString('en-US');
            document.getElementById('bankQuadNor').textContent = item.total_quad_nor.toLocaleString('en-US');
            document.getElementById('bankHalfNor').textContent = item.total_half_nor.toLocaleString('en-US');
            document.getElementById('bankCoinNor').textContent = item.total_coin_nor.toLocaleString('en-US');
            document.getElementById('bankQuadBank').textContent = item.total_quad_bank.toLocaleString('en-US');
            document.getElementById('bankHalfBank').textContent = item.total_half_bank.toLocaleString('en-US');
            document.getElementById('bankCoinBank').textContent = item.total_coin_bank.toLocaleString('en-US');
        } else {
            console.log('No bank record found for this user.');
        }

    } catch (error) {
        console.error('Error:', error);
        // alert('Error:', error);
    }
}

// main();
checkLogin();
checkInternetConnection();