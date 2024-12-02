const converter = document.getElementById("converter");
const preverContainer = document.getElementById("prever");
const inputArquivo = document.getElementById("input_arquivo");

function showTemporaryMessage(container, message, duration = 3000) {
    const msgElement = document.createElement("p");
    msgElement.innerText = message;
    container.appendChild(msgElement);

    setTimeout(() => {
        container.removeChild(msgElement);
    }, duration);
}

inputArquivo.addEventListener("change", async () => {
    preverContainer.innerHTML = "";

    for (const arquivo of inputArquivo.files) {
        const tipoArquivo = arquivo.type;

        if (tipoArquivo.startsWith("image/")) {

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.alt = "Preview";
                img.style.cssText = "width: 90%; border: 1px solid #ccc; margin: 10px;";
                preverContainer.appendChild(img);

            };
            reader.readAsDataURL(arquivo);
        } else if (tipoArquivo.startsWith("text/")) {

            const textData = await readFileAsText(arquivo);
            const textPreview = document.createElement("div");
            textPreview.style.cssText =
                "border: 1px solid #ccc; padding: 10px; margin: 10px; background-color: #f9f9f9;";

            textPreview.innerText = textData;
            preverContainer.appendChild(textPreview);

        } else if (tipoArquivo === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
 
            const reader = new FileReader();
            reader.onload = function (e) {
                const arrayBuffer = e.target.result;

                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(function (result) {
                        const wordPreview = document.createElement("div");
                        wordPreview.style.cssText = "border: 1px solid #ccc; padding: 10px; margin: 10px; background-color: #f9f9f9;";
                        wordPreview.innerText = result.value;
                        preverContainer.appendChild(wordPreview);
                        
                    })
                    .catch(function (err) {
                        console.log("Erro ao ler o arquivo Word:", err);
                    });

            };

            reader.readAsArrayBuffer(arquivo);

        } else {
            showTemporaryMessage(preverContainer, `Arquivo não suportado: ${arquivo.name}`);
        }
    }
});

converter.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const arquivos = inputArquivo.files;

    const pdf = new jsPDF();
    let isFirstPage = true;
    const status = document.getElementById("status");

    if (arquivos.length === 0) {
        showTemporaryMessage(status, "Nenhum arquivo selecionado.");
        return;
    }

    for (const arquivo of arquivos) {
        const tipoArquivo = arquivo.type;

        if (tipoArquivo.startsWith("image/")) {

            const imgData = await readFileAsDataURL(arquivo);
            const img = new Image();
            img.src = imgData;

            await new Promise((resolve) => {
                img.onload = () => {
                    if (!isFirstPage) pdf.addPage();

                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const aspectRatio = imgWidth / imgHeight;

                    let renderWidth = pageWidth;
                    let renderHeight = pageWidth / aspectRatio;

                    if (renderHeight > pageHeight) {
                        renderHeight = pageHeight;
                        renderWidth = pageHeight * aspectRatio;
                    }

                    pdf.addImage(
                        imgData,
                        "JPEG",
                        (pageWidth - renderWidth) / 2,
                        (pageHeight - renderHeight) / 2,
                        renderWidth,
                        renderHeight
                    );
                    isFirstPage = false;
                    resolve();
                };
            });
        } else if (tipoArquivo.startsWith("text/")) {

            const textData = await readFileAsText(arquivo);

            if (!isFirstPage) pdf.addPage();
            pdf.text(textData, 10, 10);
            isFirstPage = false;
        } else if (tipoArquivo === "application/pdf") {

            const pdfPreview = document.createElement("div");
            pdfPreview.innerText = `PDF: ${arquivo.name}`;
            preverContainer.appendChild(pdfPreview);

        } else if (tipoArquivo === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {

            const reader = new FileReader();
            reader.onload = function (e) {
                const arrayBuffer = e.target.result;

                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(function (result) {
                        if (!isFirstPage) pdf.addPage();
                        pdf.text(result.value, 10, 10);
                        isFirstPage = false;
                    })
                    .catch(function (err) {
                        console.log("Erro ao ler o arquivo Word:", err);
                    });

            };

            reader.readAsArrayBuffer(arquivo);

        } else {
            showTemporaryMessage(status, `Tipo de arquivo não suportado: ${arquivo.name}`);
            return;
        }
    }

    pdf.save("output.pdf");
    showTemporaryMessage(status, "PDF criado com sucesso!");
});

function readFileAsText(file) {
    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);

    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
        
    });
}
