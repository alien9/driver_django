# You will need to import these two objects to access the api
# By default, the live api will be accessed. If you wish to access the release api, you will need to
# edit the defines.py file
from data.models import Irap
from vida.modules.irap_vida.user import User
from vida.modules.irap_vida.app import App
from rest_framework.decorators import api_view
from constance import config
import os
from rest_framework.response import Response

headers_mapping = {"csv": {"content-type": "application/csv"},
                   "json": {"content-type": "application/json"}}


def ok_response(data={}, status=True, code=200, message="ok", headers='json'):
    mydata = {"data": data, "message": message, "status": status}
    return Response(data=mydata, status=code, content_type=headers_mapping[headers])


def error_response(data={}, code=401, status=False, message="error", headers='json'):
    mydata = {"data": data, "message": message, "status": status}
    return Response(data=mydata, status=code, content_type=headers_mapping[headers])

# This is a dataset that Nilesh has access to (it is in the Philippines)


@api_view(['POST'])
def login_irap(request):
    # The email and password for the user you wish to access the api as
    try:
        request_body = request.data["body"]
        user_email = request_body["username"]
        user_password = request_body["password"]
    except:
        return error_response(message="json key error")

    # First instantiate an App object, passing BROKER credentials

    app_broker = App(
        app_auth_id=int(config.IRAP_AUTH_ID),
        app_api_key=config.IRAP_API_KEY,
        app_private_key=config.IRAP_PRIVATE_KEY)
    # Then call the get_user_token method with the user's email and password
    # In theory you should only need to do this once per user (if you store the returned credentials
    # somewhere safe)
    try:
        token = app_broker.get_user_token(user_email, user_password)
    except:
        return error_response(message="Something went wrong. Token not found")
    # token {'status': 'Error', 'code': 404, 'error': 'User does not exist'}

    if not 'status' in token:
        return error_response(data=None, status=token['status'], code=token['code'], message=token['error'])
    if token['status'] == 'Error':
        return error_response(data=None, status=token['status'], code=token['code'], message=token['error'])

    # This returns the USER credentials that allow you to access ViDA on behalf of the user
    try:
        userAuthId = token['user_auth_id']
        userApiKey = token['user_api_key']
        userPrivateKey = token['user_private_key']
    except:
        return error_response(message=token["error"], status=token['status'], code=token['code'], )

    # You can now use all these credentials to instantiate a User object
    # All API calls after this are on behalf of the user
    # app_user = User(
    #          app_auth_id=appAuthId,
    #          app_api_key=appApiKey,
    #          app_private_key=appPrivateKey,
    #          user_auth_id=userAuthId,
    #          user_api_key=userApiKey,
    #          user_private_key=userPrivateKey)
    #
    # # Calling get_dataset with no parameters will return all of the datasets that the user has access to
    # dataset_response = app_user.get_datasets()
    # print("dataset_response", dataset_response)
    # # import ipdb;ipdb.set_trace()
    #
    # # The data is in the .response part of the return from the api
    # for dataset in dataset_response.response:
    #     # Convert to a Dataset object
    #     print("before", dataset)
    #     dataset = Dataset(dataset)
    #     print("dataset", dataset)
    #     # print(f'User {user_email} has access to dataset {dataset.id}')

    # get_bounds_for_dataset will give you the top left and bottom right coordinates of a bounding box for a
    # dataset, which might be useful
    # bounds_response = app_user.get_bounds_for_dataset(dataset_id)
    #
    # # You can check that your api call was successful by checking the .code component of the return
    # # Anything other than 200 means that something went wrong
    # if bounds_response.code == 200:
    #     print('\nThis response has a return code of {bounds_response.code} because everything went ok\n')
    # else:
    #     print('Something went wrong code {bounds_response.code} returned\n')

    # # Convert the returned data to a python object
    # dataset_bounds = Bound(bounds_response.response[0])
    #
    # # Print out the minimum lat and long
    # print('Dataset {dataset_id} has a bottom left corner at {dataset_bounds.minLat},{dataset_bounds.minLon}\n')
    #
    # # get_before_locations_for_dataset will fetch all the individual locations for the dataset
    # location_response = app_user.get_before_locations_for_dataset(dataset_id)
    #
    # # See how many we got
    # print('Dataset {dataset_id} has {len(location_response.response)} locations\n')
    #
    # # Convert the first location to a python object
    # location = Location(location_response.response[0])
    #
    # # Print out some information about the first location. The location_id element is unique to this location and will
    # # be useful in other api requests. There is no one method which will return the coordinates and star ratings of
    # # a location, but the location_id can be used to link the two
    # print('The first location has an id of {location.location_id}, a latitude of {location.latitude} and a longitude of {location.longitude}\n')
    #
    # # We can get all the star ratings for a dataset using get_before_star_ratings_for_dataset
    # star_ratings_response = app_user.get_before_star_ratings_for_dataset(dataset_id)
    #
    # # Get the first star rating from the list
    # star_rating = StarRating(star_ratings_response.response[0])
    #
    # # Print out the vehicle occupant star rating for this location
    # print('Location {star_rating.location_id} has a vehicle occupant star rating of {star_rating.car_star_rating_star}\n')
    #
    # # Alternatively, you can just get the star ratings for a single location, if you know its location id (fetched above)
    # star_ratings_response = app_user.get_before_star_ratings(location.location_id, dataset_id)
    # star_rating = StarRating(star_ratings_response.response[0])
    #
    # print('Location {location.location_id} has a vehicle occupant star rating of {star_rating.car_star_rating_star}\n')

    tokendata = {'user_auth_id': token['user_auth_id'],
                 'user_api_key': token['user_api_key'],
                 'user_private_key': token['user_private_key'],
                 'user_id': token['user_id']}
    if not hasattr(request.user, 'irap'):
        print("has no irap")
        irap = Irap(keys=tokendata, settings={}, user=request.user)
        irap.save()
    else:
        print("has irap")
        request.user.irap.keys = tokendata
        request.user.irap.save()
    return ok_response(message="Login successful")


@api_view(['POST'])
def getdataset(request):
    try:
        u = request.user
        d = u.irap.keys
        userAuthId = d['user_auth_id']
        userApiKey = d["user_api_key"]
        userPrivateKey = d["user_private_key"]
    except:
        return error_response(message="json key error")
    if u.irap.settings:
        if len(u.irap.settings)>0:
            return ok_response(data=u.irap.settings)
    # App api credentials as provided previously
    app_user = User(
        app_auth_id=int(config.IRAP_AUTH_ID),
        app_api_key=config.IRAP_API_KEY,
        app_private_key=config.IRAP_PRIVATE_KEY,
        user_auth_id=int(userAuthId),
        user_api_key=userApiKey,
        user_private_key=userPrivateKey)
    projects_data = app_user.get_projects()
    if projects_data.response is not None:
        for project_item in projects_data.response:
            dataset_data = app_user.get_datasets_for_project(
                project_item['id'])
            project_item["dataset_data"] = dataset_data.response
    u.irap.settings=projects_data.response
    u.irap.save()
    return ok_response(data=projects_data.response)


""" Following code is for get star rating and longitute and latitude data """


@api_view(['POST'])
def getlat_lon(request):
    try:
        u = request.user
        d = u.irap.keys
        userAuthId = d['user_auth_id']
        userApiKey = d["user_api_key"]
        userPrivateKey = d["user_private_key"]
        request_body = request.data["body"]
        dataset_id = request_body["dataset_id"]
    except:
        return error_response(message="json key error")

    app_user = User(
        app_auth_id=int(config.IRAP_AUTH_ID),
        app_api_key=config.IRAP_API_KEY,
        app_private_key=config.IRAP_PRIVATE_KEY,
        user_auth_id=int(userAuthId),
        user_api_key=userApiKey,
        user_private_key=userPrivateKey)

    datalist = []
    datadict = {}
    for did in dataset_id:
        map_star_ratings_response = app_user.get_map_star_ratings_for_dataset(
            did)
        for i in map_star_ratings_response.response:
            datalist.append(i)
    datadict["startdata"] = datalist
    return ok_response(data=datadict)


""" Following code is for get star rating and Fatility data on the basis of latitude and longitude """


@api_view(['POST'])
def fatalitydata(request):
    try:

        request_body = request.data["body"]
        u = request.user
        d = u.irap.keys
        userAuthId = d['user_auth_id']
        userApiKey = d["user_api_key"]
        userPrivateKey = d["user_private_key"]
        dataset_id = request_body["dataset_id"]
        latitude = request_body["latitude"]
        longitude = request_body["longitude"]
        language = request_body["language_code"]
    except:
        return error_response(message="json key error")

    app_user = User(
        app_auth_id=int(config.IRAP_AUTH_ID),
        app_api_key=config.IRAP_API_KEY,
        app_private_key=config.IRAP_PRIVATE_KEY,
        user_auth_id=int(userAuthId),
        user_api_key=userApiKey,
        user_private_key=userPrivateKey)
    print("created user")
    modal_info_response = app_user.get_modal_info_for_dataset(
        dataset_id, latitude, longitude, language)
    response = modal_info_response.response
    print(response)
    existing = ['road_survey_date', 'motorcycle_star_rating_star', 'longitude', 'bicycle_star_rating_star', 'bicycle_fe',
                'latitude', 'section', 'car_fe', 'dataset_id', 'location_id', 'motorcycle_fe', 'pedestrian_fe', 'countermeasures',
                'car_star_rating_star', 'pedestrian_star_rating_star', 'road_name']

    new_dict = {}
    dict_for_road_data = {}
    for keyitem, valueitem in response.items():
        if keyitem in existing:
            new_dict[keyitem] = valueitem
        else:
            dict_for_road_data[keyitem] = valueitem
    new_dict["road_features"] = []

    # jsonpath = os.path.join(os.getcwd(), "roaddata.json")
    jsonpath = os.path.join(os.getcwd(), "vida/roaddata_withimages.json")

    if not os.path.exists(jsonpath):
        return error_response(message="Json file not found")
    try:
        with open(jsonpath) as jsonobj:
            jsondata = jsonobj.read()
        evaldata = eval(jsondata)
    except:
        return error_response(message="Something went wrong")

    for key, value in dict_for_road_data.items():
        for itemdict in evaldata:
            if (str(itemdict["name"]) == str(key) and str(itemdict["sub_code"]) == str(value)):
                new_dict["road_features"].append(itemdict)
    return ok_response(data=new_dict)
