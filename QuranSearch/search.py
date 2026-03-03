import requests
import os

def search_quran_bilingual_to_file(keyword, urdu_edition="ur.jalandhry"):
    search_url = f"http://api.alquran.cloud/v1/search/{keyword}/all/{urdu_edition}"
    
    print("Searching the API, please wait...")
    
    try:
        response = requests.get(search_url)
        data = response.json()

        if data['code'] == 200 and data['data']['count'] > 0:
            results = data['data']['matches']
            count = data['data']['count']
            
            # Create a file name based on the keyword
            filename = "Quran_Search_Results.txt"
            
            # Open a text file with UTF-8 encoding (required for Urdu/Arabic)
            with open(filename, "w", encoding="utf-8") as file:
                file.write(f"--- Found {count} results for: '{keyword}' ---\n\n")
                
                for match in results:
                    surah_name = match['surah']['englishName']
                    surah_num = match['surah']['number']
                    ayah_num = match['numberInSurah']
                    absolute_ayah_num = match['number']
                    urdu_text = match['text']

                    # Fetch Arabic
                    arabic_url = f"http://api.alquran.cloud/v1/ayah/{absolute_ayah_num}/quran-simple"
                    arabic_res = requests.get(arabic_url).json()
                    arabic_text = arabic_res['data']['text']

                    # Write to the file instead of printing
                    file.write(f"📍 {surah_name} [{surah_num}:{ayah_num}]\n")
                    file.write(f"Arabic: {arabic_text}\n")
                    file.write(f"Urdu:   {urdu_text}\n")
                    file.write("-" * 50 + "\n")
            
            print(f"Success! Open the file '{filename}' in your folder to see the results.")
            
            # Automatically open the file in Windows Notepad
            os.startfile(filename)
            
        else:
            print("No results found.")
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    query = input("Enter Urdu keyword (e.g., 'نماز' or 'صبر'): ")
    search_quran_bilingual_to_file(query)