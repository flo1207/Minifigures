from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, re, json
from bs4 import BeautifulSoup
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for all routes

FILE_PATH = 'minifigures.json'  # JSON file to store minifigure data


def extract_minifigure_details(minifig_id):
    """
    Scrapes Brickset website to extract detailed information about a minifigure
    based on its ID. Returns a dictionary with details like release year, set,
    current new and used prices, and quantity.
    """
    url = f"https://brickset.com/minifigs/{minifig_id}"  # URL for minifigure page
    url2 = f"https://brickset.com/sets/{minifig_id}"    # Secondary URL for fallback

    try:
        # Request the first URL and parse the HTML content
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        featurebox = soup.find('section', class_='featurebox')

        # Request the secondary URL and parse
        response2 = requests.get(url2)
        response2.raise_for_status()
        soup2 = BeautifulSoup(response2.text, 'html.parser')

        featurebox2 = soup2.find('section', class_='featurebox')

        # If neither featurebox found, return error
        if not featurebox and not featurebox2:
            return {"error": "Featurebox not found"}

        # Prefer details from the second URL if available
        if featurebox2:
            dl = featurebox2.find('dl')  # Definition list with details
        else:
            dl = featurebox.find('dl')

        if not dl:
            return {"error": "Details list not found"}

        details = {}
        dt_elements = dl.find_all('dt')  # Terms in definition list
        dd_elements = dl.find_all('dd')  # Definitions in definition list

        # Loop over terms and definitions to extract key-value pairs
        for dt, dd in zip(dt_elements, dd_elements):
            key = dt.get_text(strip=True)
            if dd.find('a'):  # If the detail contains links
                links = [a.get_text(strip=True) for a in dd.find_all('a')]
                details[key] = links if len(links) > 1 else links[0]
            else:
                details[key] = dd.get_text(strip=True)

        # Extract current prices (new and used) from the main page
        current_value_section = soup.find('dt', text='Current value')

        new_price = None
        used_price = None

        if current_value_section:
            dd_element = current_value_section.find_next('dd')
            if dd_element:
                text = dd_element.get_text()
                # Regex to find new price in Euro
                new_price_match = re.search(r"New: ~€([\d,]+\.\d+)", text)
                if new_price_match:
                    new_price = new_price_match.group(1)

                # Regex to find used price in Euro
                used_price_match = re.search(r"Used: ~€([\d,]+\.\d+)", text)
                if used_price_match:
                    used_price = used_price_match.group(1)

            # Store extracted prices under 'Current value' key
            details["Current value"] = {
                "new_price": new_price,
                "used_price": used_price
            }

        # Add a default quantity field to track number of items
        details["Quantity"] = 1

        return details

    except requests.exceptions.RequestException as e:
        # Return error message if HTTP request fails
        return {"error": f"Request failed: {e}"}


def update_minifigure_with_comparison(minifig_id):
    """
    Loads the minifigure data from file, fetches latest details from Brickset,
    compares old and new prices, updates price history if differences found,
    and saves updated data back to file.
    """
    minifigures = load_minifigures()

    # Find the minifigure in the current database by its ID
    minifigure = next((fig for fig in minifigures if fig['Minifig number'] == minifig_id), None)

    if not minifigure:
        return {"error": "Minifigure not found in the database."}

    # Scrape new details from Brickset
    new_details = extract_minifigure_details(minifig_id)

    if "error" in new_details:
        return new_details

    # Convert prices to floats for comparison (default to 0 if None)
    new_price = float(new_details.get("Current value", {}).get("new_price", 0) or 0)
    used_price = float(new_details.get("Current value", {}).get("used_price", 0) or 0)
    current_new_price = float(minifigure.get("Current value", {}).get("new_price", 0) or 0)
    current_used_price = float(minifigure.get("Current value", {}).get("used_price", 0) or 0)

    # Calculate price differences
    new_price_diff_amount = round(new_price - current_new_price, 2)
    used_price_diff_amount = round(used_price - current_used_price, 2)

    # Initialize price history list if it doesn't exist
    if 'Price History' not in minifigure:
        minifigure['Price History'] = []

    # If price changed, create a new history entry
    if new_price != current_new_price or used_price != current_used_price:
        price_diff = {
            "date": datetime.now().strftime('%Y-%m-%d'),
            "new_price_old": current_new_price,
            "used_price_old": current_used_price,
            "new_price_diff": new_price != current_new_price,
            "new_price_diff_amount": new_price_diff_amount,
            "used_price_diff": used_price != current_used_price,
            "used_price_diff_amount": used_price_diff_amount
        }

        # Avoid duplicate entries for the same date
        existing_entry = next((entry for entry in minifigure["Price History"] if entry["date"] == price_diff["date"]), None)
        if existing_entry:
            minifigure["Price History"].remove(existing_entry)

        # Only add entry if there is a difference
        if price_diff["new_price_diff"] or price_diff["used_price_diff"]:
            minifigure["Price History"].append(price_diff)

        # Update the current prices in the minifigure record
        minifigure['Current value'] = {
            "new_price": new_price,
            "used_price": used_price
        }

        # Save updated data back to file
        save_minifigures(minifigures)
        return {"message": "Minifigure updated successfully with price differences.", "minifigure": minifigure}

    # No changes detected, return message
    return {"message": "No price difference found. Minifigure not updated.", "minifigure": minifigure}


def load_minifigures():
    """
    Loads and returns the list of minifigures stored in the JSON file.
    """
    with open(FILE_PATH, 'r') as file:
        return json.load(file)


def fetch_price_from_brickset(minifig_id):
    """
    Fetches the current new and used prices of a minifigure from the Brickset website.
    Returns a dictionary with the prices or an error message.
    """
    url = f"https://brickset.com/minifigs/{minifig_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        current_value_section = soup.find('dt', text='Current value')

        new_price = None
        used_price = None

        if current_value_section:
            dd_elements = current_value_section.find_next('dd')
            if dd_elements:
                text = dd_elements.get_text()
                new_price_match = re.search(r"New: ~€(\d+\.\d+)", text)
                if new_price_match:
                    new_price = new_price_match.group(1)

                used_price_match = re.search(r"Used: ~€(\d+\.\d+)", text)
                if used_price_match:
                    used_price = used_price_match.group(1)

        return {
            "new_price": new_price if new_price else "Not available",
            "used_price": used_price if used_price else "Not available"
        }

    except requests.exceptions.RequestException as e:
        return {"error": f"Error fetching price: {e}"}


def save_minifigures(minifigures):
    """
    Saves the entire list of minifigures to the JSON file with pretty formatting.
    """
    with open(FILE_PATH, 'w') as file:
        json.dump(minifigures, file, indent=2)


def save_minifigure(minifigures):
    """
    Updates or adds minifigures in the JSON file based on their ID or set number.
    Ensures the list stays sorted after modification.
    """
    try:
        with open(FILE_PATH, 'r') as file:
            existing_minifigures = json.load(file)
    except FileNotFoundError:
        existing_minifigures = []

    for new_minifigure in minifigures:
        minifig_id = new_minifigure.get("Minifig number")
        set_id = new_minifigure.get("Number")

        # Update or add by minifig number
        if minifig_id:
            existing_minifigures = [
                new_minifigure if m.get("Minifig number") == minifig_id else m
                for m in existing_minifigures
            ]
            if not any(m.get("Minifig number") == minifig_id for m in existing_minifigures):
                existing_minifigures.append(new_minifigure)
            sorted_minifigures = sorted(existing_minifigures, key=lambda m: m.get("Minifig number", ""))

        # Update or add by set number
        if set_id:
            existing_minifigures = [
                new_minifigure if m.get("Number") == set_id else m
                for m in existing_minifigures
            ]
            if not any(m.get("Number") == set_id for m in existing_minifigures):
                existing_minifigures.append(new_minifigure)
            sorted_minifigures = sorted(existing_minifigures, key=lambda m: m.get("Number", ""))

    # Save updated sorted list back to file
    with open(FILE_PATH, 'w') as file:
        json.dump(sorted_minifigures, file, indent=2)


@app.route('/minifigures', methods=['GET'])
def get_minifigures():
    """
    GET endpoint to retrieve all minifigures with an added comparison
    of the current used price to the last known used price.
    """
    minifigures = load_minifigures()
    

    for minifigure in minifigures:
        # Check and handle possible missing used price values
        if "Current value" in minifigure and "used_price" in minifigure["Current value"]:
            if minifigure["Current value"]["used_price"] is None:
                minifigure["Current value"]["used_price"] = 0

            current_used_price = float(minifigure["Current value"]["used_price"])

            # Retrieve last used price from price history if available
            if "Price History" in minifigure and minifigure["Price History"]:
                last_entry = minifigure["Price History"][-1]
                last_used_price = last_entry["used_price_old"]
            else:
                last_used_price = current_used_price

            difference = current_used_price - last_used_price
            increase = difference > 0
            decrease = difference < 0
            unchanged = difference == 0

            # Add price comparison data into the minifigure dict
            minifigure["Used price comparison"] = {
                "last_used_price": last_used_price,
                "current_used_price": current_used_price,
                "difference": round(difference, 2),
                "increase": increase,
                "decrease": decrease,
                "unchanged": unchanged
            }
        else:
            # Default values if no price info available
            minifigure["Used price comparison"] = {
                "last_used_price": None,
                "current_used_price": None,
                "difference": None,
                "increase": False,
                "decrease": False,
                "unchanged": True
            }

    # Save any updated info to JSON file
    save_minifigures(minifigures)
    return jsonify(minifigures)


@app.route('/minifigures', methods=['POST'])
def add_minifigure():
    """
    POST endpoint to add a new minifigure entry to the JSON database.
    """
    new_minifigure = request.json
    minifigures = load_minifigures()
    minifigures.append(new_minifigure)
    save_minifigures(minifigures)
    return jsonify(new_minifigure), 201


@app.route('/minifigures/<string:minifig_id>', methods=['GET'])
def add_minifigure_id(minifig_id):
    """
    GET endpoint to add a minifigure by its ID by scraping Brickset and
    saving the extracted details.
    """
    new_minifigure = extract_minifigure_details(minifig_id)
    minifigures = load_minifigures()
    minifigures.append(new_minifigure)
    save_minifigure(minifigures)
    return jsonify(new_minifigure), 201


@app.route('/minifigures/<string:minifig_id>', methods=['DELETE'])
def delete_minifigure(minifig_id):
    """
    DELETE endpoint to remove a minifigure by its ID from the database.
    """
    minifigures = load_minifigures()
    minifigures = [fig for fig in minifigures if fig['Minifig number'] != minifig_id]
    save_minifigures(minifigures)
    return jsonify({"message": "Minifigure deleted successfully"}), 200


@app.route('/minifigures/<string:minifig_id>', methods=['PUT'])
def update_minifigure(minifig_id):
    """
    PUT endpoint to update an existing minifigure's data by its ID.
    """
    minifigures = load_minifigures()

    for fig in minifigures:
        if fig['Minifig number'] == minifig_id:
            updated_data = request.json
            fig.update(updated_data)
            save_minifigures(minifigures)
            return jsonify(fig), 200

    return jsonify({"message": "Minifigure not found"}), 404


@app.route('/maj/<minifig_id>', methods=['GET'])
def maj_minifigure(minifig_id):
    """
    GET endpoint to update a single minifigure's prices and
    price history by scraping Brickset.
    """
    result = update_minifigure_with_comparison(minifig_id)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result), 200


@app.route('/maj', methods=['GET'])
def maj_minifigures():
    """
    GET endpoint to update all minifigures in the database with the latest
    prices and price history.
    """
    minifigures = load_minifigures()

    for minifigure in minifigures:
        update_minifigure_with_comparison(minifigure.get('Minifig number'))

    return get_minifigures(), 200


@app.route('/update_quantity', methods=['POST'])
def update_minifigure_quantity():
    """
    POST endpoint to update the quantity field of a specific minifigure.
    Expects JSON payload with 'id' and 'quantity' keys.
    """
    try:
        data = request.json
        minifig_id = data.get("id")
        new_quantity = data.get("quantity")

        with open(FILE_PATH, 'r', encoding='utf-8') as file:
            minifigures = json.load(file)

        found = False
        for minifigure in minifigures:
            if minifigure.get("Minifig number") == minifig_id:
                minifigure["Quantity"] = new_quantity
                found = True
                break

        if not found:
            return jsonify({"error": "Minifigure not found"}), 404

        with open(FILE_PATH, 'w', encoding='utf-8') as file:
            json.dump(minifigures, file, indent=4, ensure_ascii=False)

        return jsonify({"status": "success", "message": "Quantity updated"})
    except Exception as e:
        return jsonify({"error": f"Failed to update quantity: {e}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
