let contract;
const contractAddress = '0x56800C17DcCb11e47375D8bd3BD503eD7A8Fba52'; // Замените на ваш адрес контракта
let contractABI;
let web3; // Объявление переменной web3

async function fetchABI() {
    const response = await fetch('abi.json'); // Убедитесь, что ABI доступен
    contractABI = await response.json();
    initializeContract();
}

// Инициализация контракта и провайдера web3
async function initializeContract() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum); // Инициализация web3 с провайдером MetaMask
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' }); // Запрос доступа к учетным записям
        } catch (error) {
            console.error("User denied account access", error);
        }
    } else {
        console.error("MetaMask is not installed. Please install MetaMask.");
        return;
    }

    contract = new web3.eth.Contract(contractABI, contractAddress);
    await loadModels();
}

window.onload = fetchABI;

// Обработка формы для списка модели
document.getElementById('listModelForm').onsubmit = async (event) => {
    event.preventDefault();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    const name = document.getElementById('modelName').value;
    const description = document.getElementById('modelDescription').value;
    const price = document.getElementById('modelPrice').value;

    try {
        const priceInWei = web3.utils.toWei(price, 'ether'); // Преобразование цены в Wei
        console.log("Listing model with name:", name, "description:", description, "price:", priceInWei);

        const txReceipt = await contract.methods.listModel(name, description, priceInWei).send({ from: accounts[0] });
        console.log("Model listed successfully, transaction receipt:", txReceipt);

        loadModels();
    } catch (error) {
        console.error("Error listing model:", error);
        if (error.message.includes("reverted")) {
            console.error("Transaction reverted, check your contract logic.");
        }
    }
};

// Кнопка покупки модели
document.getElementById('purchaseModelButton').onclick = async () => {
    const modelId = document.getElementById('purchaseModelId').value;
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    try {
        console.log("Purchasing model with ID:", modelId);
        const model = await contract.methods.models(modelId).call();
        console.log("Model details:", model);

        const price = model.price;
        console.log("Model price in Wei:", price);

        if (price && price > 0) {
            await contract.methods.purchaseModel(modelId).send({ from: accounts[0], value: price });
            alert(`Model with ID ${modelId} purchased successfully!`);
            loadModels(); // Перезагрузка моделей после покупки
        } else {
            console.error("Invalid model price. Cannot purchase.");
        }
    } catch (error) {
        console.error("Error purchasing model:", error);
        if (error.message.includes("reverted")) {
            console.error("Transaction reverted, check your contract logic.");
        }
    }
};

// Кнопка оценки модели
document.getElementById('rateModelButton').onclick = async () => {
    const modelId = document.getElementById('rateModelId').value;
    const rating = document.getElementById('modelRating').value;
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    try {
        await contract.methods.rateModel(modelId, parseInt(rating)).send({ from: accounts[0] });
        alert(`Model with ID ${modelId} rated with ${rating} stars!`);

        loadModels(); // Перезагрузка моделей после рейтинга
    } catch (error) {
        console.error("Error rating model:", error);
        if (error.message.includes("reverted")) {
            console.error("Transaction reverted, check your contract logic.");
        }
    }
};

// Кнопка вывода средств
document.getElementById('withdrawFundsButton').onclick = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    try {
        await contract.methods.withdrawFunds().send({ from: accounts[0] });
        alert("Funds withdrawn successfully!");
    } catch (error) {
        console.error("Error withdrawing funds:", error);
    }
};

// Загрузка моделей из контракта
async function loadModels() {
    const modelList = document.getElementById('modelList');
    modelList.innerHTML = ''; // Очистка существующих моделей

    try {
        const modelCount = await contract.methods.modelCount().call(); // Получите количество моделей

        for (let i = 1; i <= modelCount; i++) {
            const modelDetails = await contract.methods.getModelDetails(i).call(); // Получите детали модели
            const averageRating = modelDetails[4] 

            modelList.innerHTML += `
                <div>
                    <strong>ID: ${i}</strong>
                    <p><strong>Name:</strong> ${modelDetails[0]}</p>
                    <p><strong>Description:</strong> ${modelDetails[1]}</p>
                    <p><strong>Price:</strong> ${web3.utils.fromWei(modelDetails[2], 'ether')} ETH</p>
                    <p><strong>Creator:</strong> ${modelDetails[3]}</p>
                    <p><strong>Average Rating:</strong> ${averageRating}</p>
                    <p>-------------------------------</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}
