let MAX_TO_SHOW = 200;

function showLoadingMessage(display) {
    showDiv("loading-message", display);
}

function showNotificationsContainer(display) {
    showDiv("notifications-container", display);
}

function showDiv(id, display) {
    document.getElementById(id).style.display = display ? "inherit" : "none";
}

function removeAllChildren(domNode) {
    while (domNode.firstChild) {
        domNode.removeChild(domNode.firstChild);
    }
}

function findNode(element, className) {
    let foundElement = null,
        found;

    function recurse(element, className, found) {
        for (let i = 0; i < element.childNodes.length && !found; i++) {
            let el = element.childNodes[i];
            let classes = el.className != undefined && el.className.split ? el.className.split(" ") : [];
            for (let j = 0, jl = classes.length; j < jl; j++) {
                if (classes[j] == className) {
                    found = true;
                    foundElement = element.childNodes[i];
                    break;
                }
            }
            if (found)
                break;
            recurse(element.childNodes[i], className, found);
        }
    }

    recurse(element, className, false);
    return foundElement;
}

function nodeFromTemplate(templateId) {
    let notificationTemplate = document.getElementById(templateId);
    let result = notificationTemplate.cloneNode(true);
    result.removeAttribute("id");
    result.style.display = "inherit";
    return result;
}

function setLogo(notificationNode, logo) {
    findNode(notificationNode, "logo").children[0].className = logo;
}

function setLogoBasedOnStatus(notificationNode, status) {
    if (status === "PENDING_ACCEPTANCE") {
        setLogo(notificationNode, "far fa-hourglass");
    } else if (status === "UNDER_NEGOTIATION") {
        setLogo(notificationNode, "fas fa-cogs");
    } else if (status === "BUYER_APPROVED") {
        setLogo(notificationNode, "far fa-handshake");
    } else if (status === "SUBMITTED_FOR_SELLER_APPROVAL") {
        setLogo(notificationNode, "fas fa-share");
    } else if (status === "SUBMITTED_FOR_BUYER_APPROVAL") {
        setLogo(notificationNode, "fas fa-share");
    } else {
        console.log("Unknown status " + status);
    }
}

function showNotifications(notifications) {
    notifications.sort((n1, n2) => {
        return new Date(n2.Created_Datetime).getTime() - new Date(n1.Created_Datetime).getTime();
    });
    let received = notifications.length;
    if (received > MAX_TO_SHOW) {
        notifications = notifications.slice(0, Math.min(MAX_TO_SHOW, received));
        document.getElementById("num-loaded").innerHTML = "Loaded " + received + " notifications, showing " + MAX_TO_SHOW + " most recent.";
    } else {
        document.getElementById("num-loaded").innerHTML = "Loaded " + received + " notifications.";
    }
    let notificationsList = document.getElementById("notifications-list");
    removeAllChildren(notificationsList);

    notifications.forEach(notification => {
        let notificationNode = nodeFromTemplate("notification-template");
        notificationsList.appendChild(notificationNode);
        let date = moment(notification.Created_Datetime);
        findNode(notificationNode, "date").innerHTML = moment(date).format('llll');
        let status = notification.Cause_Status;
        findNode(notificationNode, "status").innerHTML = status;
        findNode(notificationNode, "subject").innerHTML = notification.Primary_Subject;
        findNode(notificationNode, "subject-id").innerHTML = notification.Primary_Subject_Id;
        setLogoBasedOnStatus(notificationNode, status);
    });
}

function getNotifications(id) {
    showLoadingMessage(true);
    showNotificationsContainer(false);
    let xmlhttp = new XMLHttpRequest();
    let url = "/api/notifications";
    if (id !== "") {
        url = url.concat("?id=").concat(id);
    }

    xmlhttp.onreadystatechange = (event) => {
        let request = event.target;
        if (request.readyState === 4 && request.status === 200) {
            let notifications = JSON.parse(request.responseText);
            console.log("Received " + notifications.items.length + " notifications");
            showNotifications(notifications.items);
            showLoadingMessage(false);
            showNotificationsContainer(true);
        }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Content-Type", "application/json");

    return xmlhttp.send();
}

function windowLoaded() {
    let id = getParams();
    getNotifications(id);
}

function getParams() {
    let parameters = location.search.substring(1).split("&");
    if (parameters.length == 1 && parameters[0].length > 0) {
        let id = parameters[0].split("=")[1];
        console.log(id);
        return id;
    }
    
    return "";
}

window.onload = windowLoaded;