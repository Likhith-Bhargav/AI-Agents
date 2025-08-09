from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer, 
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer
)

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    """View for user registration."""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate token for the new user
        token_serializer = CustomTokenObtainPairSerializer(data={
            'email': request.data['email'],
            'password': request.data['password']
        })
        token_serializer.is_valid(raise_exception=True)
        
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
            },
            'tokens': token_serializer.validated_data
        }, status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view that includes user data in the response."""
    serializer_class = CustomTokenObtainPairSerializer

class ChangePasswordView(generics.UpdateAPIView):
    """View for changing password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self, queryset=None):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response(
                    {"old_password": ["Wrong password."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            
            return Response(
                {"message": "Password updated successfully"}, 
                status=status.HTTP_200_OK
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for retrieving and updating user profile."""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserRegistrationSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        # Don't allow updating password through this endpoint
        if 'password' in request.data:
            del request.data['password']
        if 'password2' in request.data:
            del request.data['password2']
            
        return super().update(request, *args, **kwargs)

class CheckAuthView(APIView):
    """View to check if the user is authenticated."""
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        """
        Return the authenticated user's data if the token is valid.
        """
        user = request.user
        return Response({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
        })
